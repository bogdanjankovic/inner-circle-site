
/**
 * Strips HTML tags from a string, returning only valid text.
 * Useful for TTS or previews where rich text is not supported.
 */
export function stripHtml(html: string): string {
    if (!html) return "";
    // 1. Create a logical generic container (in browser) or use RegEx (server/universal).
    // Since this runs on client (WatchProtocol is 'use client'), DOMParser is safest for proper decoding (e.g. &amp;)
    // BUT RegEx is faster and doesn't rely on DOM if running in node context (though this is nextjs app dir).
    // Let's use a robust RegEx for now to avoid DOM dependency issues in edge cases, 
    // or better, a standard Browser approach if we are sure it's client.

    // Simple regex strip is usually enough for basic rich text editor output:
    return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ');
}
