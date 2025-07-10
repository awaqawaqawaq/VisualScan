
import React, { useState, useMemo } from 'react';
import { Tag as ITag } from '../../types';
import Tag from '../Tag';
import { mapOfficialTag } from '../../utils/tags';

interface TaggingSectionProps {
    officialTags: string[];
    communityTags: ITag[];
    onAddTag: (tag: Omit<ITag, 'id' | 'upvotes' | 'downvotes' | 'submittedBy' | 'upvoted' | 'downvoted' | 'asset'>) => void;
    onUpvoteTag: (tagId: string) => void;
    onDownvoteTag: (tagId: string) => void;
    onTagSelect: (tag: ITag) => void;
    isSubmitting: boolean;
}

const PREDEFINED_TAGS: Record<ITag['category'], string[]> = {
  Behavior: ['Memecoin Sniper', 'Airdrop Hunter', 'Yield Farmer', 'High Frequency Trader', 'Swing Trader', 'Diamond Hands', 'Paper Hands'],
  Identity: ['KOL', 'Founder', 'Developer', 'VC', 'Artist', 'DAO Member'],
  Asset: ['Whale', 'Dolphin', 'Fish', 'Shrimp', 'NFT Collector', 'LP Provider'],
  Warning: ['Scammer', 'Hacker', 'Sanctioned Address', 'High Risk', 'Wash Trader'],
  General: ['Active Wallet', 'Burn Address', 'Contract'],
};

const TaggingSection: React.FC<TaggingSectionProps> = ({ officialTags, communityTags, onAddTag, onUpvoteTag, onDownvoteTag, onTagSelect, isSubmitting }) => {
    const [newTagText, setNewTagText] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<ITag['category']>('Behavior');
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [isFormVisible, setIsFormVisible] = useState(false);
    
    const allCommunityTagTexts = useMemo(() => new Set((communityTags || []).map(t => t.text.toLowerCase())), [communityTags]);

    const suggestions = useMemo(() => {
        const categorySuggestions = PREDEFINED_TAGS[selectedCategory] || [];
        // Filter out suggestions that are already added as community tags
        return categorySuggestions.filter(s => !allCommunityTagTexts.has(s.toLowerCase()));
    }, [selectedCategory, allCommunityTagTexts]);

    const handleAddTag = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTagText.trim() && !allCommunityTagTexts.has(newTagText.trim().toLowerCase())) {
            onAddTag({ text: newTagText.trim(), category: selectedCategory });
            setNewTagText('');
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        onAddTag({ text: suggestion, category: selectedCategory });
    }

    const combinedTags = useMemo(() => [
        ...(officialTags || []).map(t => ({...mapOfficialTag(t), isOfficial: true})),
        ...(communityTags || []).map(t => ({...t, isOfficial: false})),
    ].sort((a,b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes)), [officialTags, communityTags]);

    return (
        <div className="bg-gray-800/50 rounded-lg p-6 ring-1 ring-gray-700">
            <h3 className="text-lg font-semibold text-white">Community Intelligence</h3>
            <p className="text-sm text-gray-400 mt-1">Help build a clearer picture of this address by adding and voting on tags.</p>

            <div className="mt-4 flex flex-wrap gap-2 items-center">
                {combinedTags.map(tag => (
                    <Tag
                        key={tag.id}
                        tag={tag}
                        onUpvote={!tag.isOfficial ? onUpvoteTag : undefined}
                        onDownvote={!tag.isOfficial ? onDownvoteTag : undefined}
                        onTagSelect={onTagSelect}
                        isOfficial={tag.isOfficial}
                    />
                ))}
            </div>
            
            {isFormVisible ? (
                <div className="mt-6 pt-6 border-t border-gray-700">
                    <form onSubmit={handleAddTag} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="md:col-span-2">
                            <label htmlFor="tag-text" className="block text-sm font-medium text-gray-300 mb-1">Add New Tag</label>
                            <div className="relative">
                                <input
                                    id="tag-text"
                                    type="text"
                                    value={newTagText}
                                    onChange={(e) => setNewTagText(e.target.value)}
                                    onFocus={() => setIsInputFocused(true)}
                                    onBlur={() => setTimeout(() => setIsInputFocused(false), 200)} // delay to allow click on suggestions
                                    placeholder="e.g., Early ETH Adopter"
                                    className="block w-full rounded-md border-0 py-2 px-3 bg-gray-900 text-white ring-1 ring-inset ring-gray-600 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="tag-category" className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                            <select
                                id="tag-category"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value as ITag['category'])}
                                className="block w-full rounded-md border-0 py-2 pl-3 pr-10 bg-gray-900 text-white ring-1 ring-inset ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm"
                            >
                                {Object.keys(PREDEFINED_TAGS).map(cat => <option key={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-3">
                            <button type="submit" className="w-full md:w-auto justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!newTagText.trim() || allCommunityTagTexts.has(newTagText.trim().toLowerCase()) || isSubmitting}>
                                {isSubmitting ? 'Submitting...' : 'Submit Tag & Earn $INFO'}
                            </button>
                        </div>
                    </form>
                    {isInputFocused && suggestions.length > 0 && (
                        <div className="mt-2 p-2 bg-gray-900 rounded-md ring-1 ring-gray-700">
                            <h4 className="text-xs text-gray-400 mb-2">Suggestions for <span className="font-semibold text-gray-300">{selectedCategory}</span>:</h4>
                            <div className="flex flex-wrap gap-2">
                                {suggestions.map(s => (
                                    <button key={s} type="button" onClick={() => handleSuggestionClick(s)} className="px-2.5 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded-full transition-colors">
                                        + {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="mt-4 pt-4 border-t border-gray-700/50">
                    <button 
                        onClick={() => setIsFormVisible(true)}
                        className="w-full md:w-auto flex items-center justify-center gap-2 rounded-md bg-gray-700/50 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                        Add a Tag
                    </button>
                </div>
            )}
        </div>
    );
};

export default TaggingSection;