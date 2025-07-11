
import React from 'react';
import { Tag as TagType } from '../types';
import { ThumbUpIcon, ThumbDownIcon } from './icons';

interface TagProps {
  tag: TagType;
  onUpvote?: (tagId: string) => void;
  onDownvote?: (tagId: string) => void;
  onTagSelect?: (tag: TagType) => void;
  isOfficial?: boolean;
  disableTooltip?: boolean;
}

const tagColorClasses: Record<TagType['category'], string> = {
  Behavior: 'bg-sky-500/10 text-sky-300 ring-sky-500/20 hover:ring-sky-400',
  Identity: 'bg-violet-500/10 text-violet-300 ring-violet-500/20 hover:ring-violet-400',
  Asset: 'bg-orange-500/10 text-orange-300 ring-orange-500/20 hover:ring-orange-400',
  Warning: 'bg-rose-500/10 text-rose-300 ring-rose-500/20 hover:ring-rose-400',
  General: 'bg-teal-500/10 text-teal-300 ring-teal-500/20 hover:ring-teal-400'
};

const officialColorClass = 'bg-green-500/10 text-green-300 ring-green-500/20 hover:ring-green-400';
const memeRadarColorClass = 'bg-pink-500/10 text-pink-300 ring-pink-500/20 hover:ring-pink-400';


const categoryDescriptions = {
  Behavior: 'Describes the typical on-chain activities and strategies of the wallet.',
  Identity: 'Relates to the real-world or pseudonymous identity behind the wallet.',
  Asset: 'Indicates ownership of specific tokens or NFTs.',
  Warning: 'Highlights potential risks or suspicious activities associated with the wallet.',
  General: 'A general tag describing the wallet.',
};

const Tag: React.FC<TagProps> = ({ tag, onUpvote, onDownvote, onTagSelect, isOfficial = false, disableTooltip = false }) => {
  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUpvote) onUpvote(tag.id);
  };
  
  const handleDownvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDownvote) onDownvote(tag.id);
  };

  const handleTagClick = () => {
    if (onTagSelect) {
      onTagSelect(tag);
    }
  }
  
  const colorClass = isOfficial
    ? officialColorClass
    : tag.submittedBy === 'MemeRadar'
      ? memeRadarColorClass
      : tagColorClasses[tag.category] || tagColorClasses.General;
    
  const canVote = !isOfficial && onUpvote && onDownvote;
  const netVotes = (tag.upvotes || 0) - (tag.downvotes || 0);
  const hasVotesToShow = !isOfficial && (tag.upvotes || 0) > 0;

  const isClickable = !!onTagSelect;


  return (
    <div className="relative group">
      <div 
        onClick={isClickable ? handleTagClick : undefined}
        onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleTagClick(); } } : undefined}
        role={isClickable ? "button" : undefined}
        tabIndex={isClickable ? 0 : -1}
        className={`flex items-center gap-2 pl-2.5 pr-1 py-1 rounded-full text-xs font-medium ring-1 ring-inset transition-all outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 ${colorClass} ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <span>{tag.text}</span>
        {tag.asset && <span className="ml-1.5 text-xs font-mono text-gray-400 opacity-80">[{tag.asset}]</span>}
        
        {canVote ? (
            <div className="flex items-center gap-0.5 bg-gray-900/20 rounded-full ml-1">
              <button
                onClick={handleUpvote}
                className={`flex items-center gap-1 group rounded-full p-1 ${tag.upvoted ? 'text-green-400' : 'text-gray-400 hover:text-white'}`}
                aria-label={`Upvote tag: ${tag.text}`}
              >
                <ThumbUpIcon className="w-3 h-3" />
              </button>
              <span className="font-mono text-xs px-1 text-gray-300">{netVotes}</span>
              <button
                onClick={handleDownvote}
                className={`flex items-center gap-1 group rounded-full p-1 ${tag.downvoted ? 'text-red-400' : 'text-gray-400 hover:text-white'}`}
                aria-label={`Downvote tag: ${tag.text}`}
              >
                <ThumbDownIcon className="w-3 h-3" />
              </button>
            </div>
        ) : hasVotesToShow && (
           <span className="font-mono text-xs px-2 text-gray-300 bg-gray-900/30 rounded-full ml-1.5">{netVotes}</span>
        )}

      </div>
      {!disableTooltip && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-xs bg-gray-700 text-white text-xs rounded-md px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg ring-1 ring-gray-600 z-20">
              {tag.submittedBy === 'MemeRadar' ? (
                  <div className="text-gray-300">Sourced from <span className="font-semibold text-pink-400">MemeRadar</span></div>
              ) : (
                  <>
                    <p><span className="font-bold">{tag.category}</span>: {categoryDescriptions[tag.category]}</p>
                    {tag.asset && <p className="mt-1">Asset Context: <span className="font-semibold text-green-300">{tag.asset}</span></p>}
                    {isOfficial ? (
                         <div className="mt-1 text-green-300 font-semibold">Official Tag</div>
                    ) : (
                        <div className="mt-1 text-gray-400">Submitted by: {tag.submittedBy}</div>
                    )}
                  </>
              )}
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-700"></div>
          </div>
      )}
    </div>
  );
};

export default Tag;
