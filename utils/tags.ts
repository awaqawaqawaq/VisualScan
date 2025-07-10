import { Tag } from '../types';

/**
 * Extracts an asset symbol from a tag name if it exists (e.g., "BRETT Whale [BRETT]").
 * @param tagName The raw tag string.
 * @returns An object containing the extracted asset and the cleaned tag name.
 */
export const extractAssetFromTagName = (tagName: string): { asset: string | undefined; cleanTag: string } => {
    const match = tagName.match(/\[(.*?)\]/);
    if (match) {
        return { asset: match[1], cleanTag: tagName.replace(match[0], '').trim() };
    }
    return { asset: undefined, cleanTag: tagName };
};

/**
 * Maps a raw tag string to a structured Tag object.
 * It determines the category, extracts any asset context, and sets default properties.
 * @param tagText The raw tag string.
 * @returns A structured Tag object.
 */
export const mapOfficialTag = (tagText: string): Tag => {
    const { asset, cleanTag } = extractAssetFromTagName(tagText);
    const textLower = cleanTag.toLowerCase();
    
    let category: Tag['category'] = 'General';
    if (textLower.includes('kol') || textLower.includes('founder') || textLower.includes('og') || textLower.includes('influencer')) category = 'Identity';
    else if (textLower.includes('sniper') || textLower.includes('farmer') || textLower.includes('hunter') || textLower.includes('hands')) category = 'Behavior';
    else if (textLower.includes('risk') || textLower.includes('warning') || textLower.includes('scammer') || textLower.includes('hacker')) category = 'Warning';
    else if (textLower.includes('whale') || textLower.includes('holder') || textLower.includes('pepe') || textLower.includes('brett') || textLower.includes('币安') || textLower.includes('gate.io')) category = 'Asset';

    return {
        id: `official-${tagText}`,
        text: cleanTag,
        asset,
        category,
        upvotes: 0,
        downvotes: 0,
        submittedBy: 'Official',
        upvoted: false,
        downvoted: false,
        isOfficial: true,
    };
};
