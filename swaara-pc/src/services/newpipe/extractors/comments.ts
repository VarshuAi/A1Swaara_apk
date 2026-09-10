/**
 * ZenTube Comments Extractor
 * Extracts comments and replies for a YouTube video
 * Supports both modern YouTube ViewModel entities and legacy commentRenderers
 * Inspired by NewPipe's CommentsExtractor.java
 */

import { HttpClient } from '../core/http.ts';
import { InnerTubeClient } from '../core/clients.ts';
import { getText, parseInteger } from '../utils/parser.ts';
import { extractVideoId } from '../utils/helper.ts';
import type { CommentItem } from '../types.ts';

export class CommentsExtractor {
  /**
   * Fetches comments for a video
   */
  public static async getComments(
    videoIdOrUrl: string,
    continuationToken?: string
  ): Promise<{ comments: CommentItem[]; continuationToken?: string }> {
    const videoId = extractVideoId(videoIdOrUrl);
    if (!videoId) {
      throw new Error(`Invalid YouTube video ID or URL: "${videoIdOrUrl}"`);
    }

    const visitorData = await HttpClient.getVisitorData();
    const webContext = InnerTubeClient.createWebContext(visitorData);

    let token = continuationToken;

    // If no continuationToken provided, get the initial comments token from /next endpoint
    if (!token) {
      const nextData = await HttpClient.postJson<any>(
        `${InnerTubeClient.ENDPOINTS.NEXT}?prettyPrint=false`,
        InnerTubeClient.prepareNextBody(videoId, webContext),
        { headers: InnerTubeClient.getWebHeaders() }
      );

      // Find comments continuation token in engagement panels
      const panels = nextData?.engagementPanels || [];
      for (const panel of panels) {
        const pRenderer = panel?.engagementPanelSectionListRenderer;
        if (pRenderer?.panelIdentifier === 'engagement-panel-comments-section') {
          const itemSection = pRenderer.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer;
          const continuationItem = itemSection?.contents?.find((c: any) => c.continuationItemRenderer);
          token = continuationItem?.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token;
          break;
        }
      }

      // Fallback: check twoColumnWatchNextResults
      if (!token) {
        const contents = nextData?.contents?.twoColumnWatchNextResults?.results?.results?.contents || [];
        const commentsSection = contents.find((c: any) => c.itemSectionRenderer?.sectionIdentifier === 'comment-item-section');
        const continuationItem = commentsSection?.itemSectionRenderer?.contents?.find((c: any) => c.continuationItemRenderer);
        token = continuationItem?.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token;
      }
    }

    if (!token) {
      return { comments: [] };
    }

    // Fetch comments with the continuation token
    const commentsData = await HttpClient.postJson<any>(
      `${InnerTubeClient.ENDPOINTS.NEXT}?prettyPrint=false`,
      {
        context: { client: webContext },
        continuation: token,
      },
      { headers: InnerTubeClient.getWebHeaders() }
    );

    const comments: CommentItem[] = [];
    let nextToken: string | undefined;

    // Extract next continuation token from endpoints
    const endpoints = commentsData.onResponseReceivedEndpoints || [];
    for (const ep of endpoints) {
      const items =
        ep.reloadContinuationItemsCommand?.continuationItems ||
        ep.appendContinuationItemsAction?.continuationItems ||
        [];
      for (const item of items) {
        if (item.continuationItemRenderer) {
          nextToken = item.continuationItemRenderer.continuationEndpoint?.continuationCommand?.token;
        }
      }
    }

    // 1. Check Modern Framework Mutations (YouTube's modern comment storage)
    const mutations = commentsData.frameworkUpdates?.entityBatchUpdate?.mutations || [];
    const toolbarMap: Record<string, any> = {};
    for (const m of mutations) {
      if (m.payload?.commentToolbarPayload) {
        toolbarMap[m.key] = m.payload.commentToolbarPayload;
      }
    }

    for (const m of mutations) {
      const p = m.payload?.commentEntityPayload;
      if (!p || !p.properties) continue;

      const props = p.properties;
      const author = p.author || {};
      const toolbar = toolbarMap[props.toolbarStateKey] || {};

      comments.push({
        id: props.commentId || '',
        authorName: author.displayName || props.authorButtonA11y || 'User',
        authorAvatarUrl: author.avatarThumbnailUrl,
        authorChannelId: author.channelId,
        content: props.content?.content || '',
        publishedTimeText: props.publishedTime || '',
        likeCountText: toolbar.likeCountNotliked || toolbar.likeCount || '0',
        replyCount: parseInteger(props.replyCount, 0),
      });
    }

    // 2. Fallback: Parse Classic commentThreadRenderers if mutations were empty
    if (comments.length === 0) {
      for (const ep of endpoints) {
        const items =
          ep.reloadContinuationItemsCommand?.continuationItems ||
          ep.appendContinuationItemsAction?.continuationItems ||
          [];

        for (const item of items) {
          const thread = item.commentThreadRenderer;
          const c = thread?.comment?.commentRenderer;
          if (!c) continue;

          comments.push({
            id: c.commentId || '',
            authorName: getText(c.authorText),
            authorAvatarUrl: c.authorThumbnail?.thumbnails?.[0]?.url,
            authorChannelId: c.authorEndpoint?.browseEndpoint?.browseId,
            content: getText(c.contentText),
            publishedTimeText: getText(c.publishedTimeText),
            likeCountText: getText(c.voteCount),
            replyCount: parseInteger(thread.replies?.commentRepliesRenderer?.viewReplies?.buttonRenderer?.text?.runs?.[0]?.text, 0),
          });
        }
      }
    }

    return { comments, continuationToken: nextToken };
  }
}
