
import React, { useRef, useLayoutEffect, useMemo, useEffect } from 'react';
import * as echarts from 'echarts';
import { Tag as ITag, AddressData } from '../../types';
import { ChevronLeftIcon, TrendingUpIcon, ThumbUpIcon, ThumbDownIcon, UsersIcon } from '../icons';
import { gsap } from 'gsap';
import { mapOfficialTag } from '../../utils/tags';

type EChartsOption = any;

interface TagDetailProps {
  tag: ITag;
  allAddresses: AddressData[];
  onBack: () => void;
  onAddressSelect: (address: AddressData) => void;
}

const tagColorClasses: Record<ITag['category'], { bg: string, text: string, ring: string }> = {
  Behavior: { bg: 'bg-sky-500/10', text: 'text-sky-300', ring: 'ring-sky-500/30' },
  Identity: { bg: 'bg-violet-500/10', text: 'text-violet-300', ring: 'ring-violet-500/30' },
  Asset: { bg: 'bg-orange-500/10', text: 'text-orange-300', ring: 'ring-orange-500/30' },
  Warning: { bg: 'bg-rose-500/10', text: 'text-rose-300', ring: 'ring-rose-500/30' },
  General: { bg: 'bg-teal-500/10', text: 'text-teal-300', ring: 'ring-teal-500/30' }
};

const officialTagColors = { bg: 'bg-green-500/10', text: 'text-green-300', ring: 'ring-green-500/30' };
const memeRadarTagColors = { bg: 'bg-pink-500/10', text: 'text-pink-300', ring: 'ring-pink-500/30' };


const InfoCard: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, icon, children, className }) => (
    <div className={`bg-gray-800/50 p-4 md:p-5 rounded-xl ring-1 ring-gray-700 h-full ${className}`}>
        <div className="flex items-center gap-3">
            {icon}
            <h3 className="text-base font-semibold text-white">{title}</h3>
        </div>
        <div className="mt-4">
            {children}
        </div>
    </div>
);


const TagDetail: React.FC<TagDetailProps> = ({ tag, allAddresses, onBack, onAddressSelect }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const trendChartRef = useRef<HTMLDivElement>(null);
    const cooccurrenceChartRef = useRef<HTMLDivElement>(null);
    
    const addressMap = useMemo(() => {
        return allAddresses.reduce((acc, addr) => {
            acc[addr.address.toLowerCase()] = addr;
            return acc;
        }, {} as Record<string, AddressData>);
    }, [allAddresses]);

    const associatedAddresses = useMemo(() => {
        const lowerCaseTagText = tag.text.toLowerCase();
        return allAddresses.filter(addr => {
            const officialMatch = addr.pnlData.tags.some(t => {
                const mapped = mapOfficialTag(t);
                return mapped.text.toLowerCase() === lowerCaseTagText && mapped.asset === tag.asset;
            });
            const communityMatch = addr.communityTags.some(ct => 
                ct.text.toLowerCase() === lowerCaseTagText && ct.asset === tag.asset
            );
            return officialMatch || communityMatch;
        }).sort((a, b) => b.pnlData.followers_count - a.pnlData.followers_count) // Sort by influence
         .slice(0, 5);
    }, [tag, allAddresses]);
    
    const submitterAddressData = useMemo(() => {
        if (!tag.submittedBy || tag.submittedBy === 'MemeRadar' || tag.isOfficial) return null;
        return addressMap[tag.submittedBy.toLowerCase()];
    }, [tag, addressMap]);

    const votersWithData = useMemo(() => {
        return (tag.voters || []).map(voterAddress => ({
            address: voterAddress,
            data: addressMap[voterAddress.toLowerCase()]
        })).slice(0, 10); // Limit to 10 voters
    }, [tag, addressMap]);

    const hasContributions = tag.submittedBy || (tag.voters && tag.voters.length > 0);

    const voteHistoryForChart = useMemo(() => {
        // If vote history exists and is not empty, use it.
        if (tag.voteHistory && tag.voteHistory.length > 0) {
            return tag.voteHistory;
        }

        // Otherwise, generate some mock data for the chart.
        // This ensures the chart always has something to render.
        const mockHistory: { date: string, count: number }[] = [];
        const totalUpvotes = tag.upvotes || Math.floor(Math.random() * 50);
        let currentVotes = Math.max(0, totalUpvotes - Math.floor(Math.random() * 20));
        
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            
            currentVotes += Math.random() * 2;
            if (currentVotes > totalUpvotes) {
                currentVotes = totalUpvotes;
            }

            mockHistory.push({
                date: d.toLocaleDateString('en-CA'),
                count: Math.floor(currentVotes),
            });
        }
        if (mockHistory.length > 0) {
            mockHistory[mockHistory.length - 1].count = totalUpvotes;
        }
        return mockHistory;
    }, [tag.voteHistory, tag.upvotes]);


    useLayoutEffect(() => {
        if (!containerRef.current) return;
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { opacity: 0, ease: 'power3.out' } });
            tl.from('.anim-back-button', { x: -20, duration: 0.4 })
              .from('.anim-header', { y: -20, duration: 0.5 }, '-=0.2')
              .from('.anim-content > *', { y: 20, stagger: 0.1, duration: 0.5 }, '-=0.3')
        }, containerRef);
        return () => ctx.revert();
    }, [tag]);

    // Trend Chart Effect
    useEffect(() => {
        let chartInstance: echarts.ECharts | null = null;
        if (trendChartRef.current && voteHistoryForChart && voteHistoryForChart.length > 0) {
            chartInstance = echarts.init(trendChartRef.current, 'dark', { renderer: 'canvas' });
            
            const dates = voteHistoryForChart.map(h => h.date);
            const data = voteHistoryForChart.map(h => h.count);

            const option: EChartsOption = {
                backgroundColor: 'transparent',
                tooltip: { trigger: 'axis' },
                grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
                xAxis: { type: 'category', boundaryGap: false, data: dates },
                yAxis: { type: 'value', name: 'Upvotes' },
                series: [{
                    name: 'Upvotes',
                    type: 'line',
                    smooth: true,
                    data: data,
                    itemStyle: { color: '#3B82F6' },
                    areaStyle: {
                      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(59, 130, 246, 0.5)' },
                        { offset: 1, color: 'rgba(59, 130, 246, 0)' }
                      ])
                    }
                }]
            };
            chartInstance.setOption(option);
        }
        return () => chartInstance?.dispose();
    }, [voteHistoryForChart]);

    // Co-occurrence Chart Effect
    useEffect(() => {
        let chartInstance: echarts.ECharts | null = null;
        if (cooccurrenceChartRef.current) {
            chartInstance = echarts.init(cooccurrenceChartRef.current, 'dark', { renderer: 'canvas' });
            
            // Mock data for co-occurrence
            const data = [
                { value: Math.floor(Math.random()*40) + 10, name: 'Behavior' },
                { value: Math.floor(Math.random()*30) + 5, name: 'Warning' },
                { value: Math.floor(Math.random()*20), name: 'Asset' },
                { value: Math.floor(Math.random()*15), name: 'Identity' },
            ].filter(d => d.name !== tag.category);

            const option: EChartsOption = {
                backgroundColor: 'transparent',
                tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
                legend: { show: false },
                series: [{
                    type: 'pie',
                    radius: ['50%', '80%'],
                    avoidLabelOverlap: false,
                    label: { show: true, position: 'inside', formatter: '{b}\n{d}%', color: '#fff', fontSize: 10 },
                    emphasis: { label: { show: true, fontSize: 12, fontWeight: 'bold' } },
                    labelLine: { show: false },
                    data: data,
                }]
            };
            chartInstance.setOption(option);
        }
        return () => chartInstance?.dispose();
    }, [tag]);

    const colors = tag.isOfficial
        ? officialTagColors
        : tag.submittedBy === 'MemeRadar'
            ? memeRadarTagColors
            : tagColorClasses[tag.category] || tagColorClasses.General;

    return (
        <div ref={containerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 anim-back-button">
                <ChevronLeftIcon className="w-5 h-5" />
                Back
            </button>
            
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 anim-header mb-8">
                <div className={`flex items-center gap-3 px-4 py-2 rounded-lg ${colors.bg} ring-1 ${colors.ring}`}>
                    <span className={`text-2xl font-bold ${colors.text}`}>{tag.text}</span>
                    {tag.asset && <span className="text-lg font-mono text-gray-400 opacity-90">[{tag.asset}]</span>}
                    <span className="text-sm bg-gray-900/50 text-gray-300 px-2 py-1 rounded-full">{tag.category}</span>
                </div>
                 {!tag.isOfficial && (
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-green-400"><ThumbUpIcon className="w-4 h-4" /> {tag.upvotes}</div>
                        <div className="flex items-center gap-1.5 text-red-400"><ThumbDownIcon className="w-4 h-4" /> {tag.downvotes}</div>
                    </div>
                )}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 anim-content">
                <div className="lg:col-span-2">
                    <InfoCard title="Upvote Trend (30d)" icon={<TrendingUpIcon className="w-5 h-5 text-gray-300"/>}>
                       <div ref={trendChartRef} className="w-full h-64 -ml-4"></div>
                    </InfoCard>
                </div>
                <div>
                     <InfoCard title="Co-occurrence">
                        <div ref={cooccurrenceChartRef} className="w-full h-64"></div>
                    </InfoCard>
                </div>
                
                {hasContributions && (
                    <div className="lg:col-span-3">
                        <InfoCard title="Community Contributions" icon={<UsersIcon className="w-5 h-5 text-gray-300"/>}>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-400">Submitted By</h4>
                                    {tag.submittedBy === 'MemeRadar' ? (
                                        <div className="mt-2 flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-300 font-bold">M</div>
                                            <span className="font-semibold text-white">MemeRadar</span>
                                        </div>
                                    ) : submitterAddressData ? (
                                        <button onClick={() => onAddressSelect(submitterAddressData)} className="mt-2 flex items-center gap-2 text-left hover:bg-gray-700/50 p-2 rounded-lg transition-colors w-full">
                                            <img className="w-8 h-8 rounded-full object-cover" src={submitterAddressData.pnlData.avatar} alt="submitter"/>
                                            <div>
                                                <p className="text-sm font-medium text-white">{submitterAddressData.pnlData.ens || submitterAddressData.pnlData.name}</p>
                                                <p className="text-xs text-gray-400 font-mono">{submitterAddressData.address}</p>
                                            </div>
                                        </button>
                                    ) : (
                                        <p className="mt-1 text-sm font-mono text-gray-300">{tag.submittedBy}</p>
                                    )}
                                </div>
                                {votersWithData.length > 0 && (
                                     <div>
                                        <h4 className="text-sm font-semibold text-gray-400">Voters ({votersWithData.length})</h4>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {votersWithData.map(voter => (
                                                voter.data ? (
                                                    <button key={voter.address} onClick={() => onAddressSelect(voter.data)} className="group relative">
                                                        <img className="w-8 h-8 rounded-full object-cover ring-2 ring-transparent group-hover:ring-blue-500 transition" src={voter.data.pnlData.avatar} alt={voter.data.pnlData.name} />
                                                    </button>
                                                ) : (
                                                    <div key={voter.address} className="group relative">
                                                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 text-xs ring-2 ring-transparent">
                                                          {voter.address.substring(2,4)}
                                                        </div>
                                                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max bg-gray-700 text-white text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg ring-1 ring-gray-600 z-10">{voter.address}</div>
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                     </div>
                                )}
                            </div>
                        </InfoCard>
                    </div>
                )}


                <div className="lg:col-span-3">
                    <InfoCard title="Top Associated Wallets">
                        <div className="flow-root">
                            <ul role="list" className="divide-y divide-gray-800">
                                {associatedAddresses.map(addr => (
                                <li key={addr.id} className="py-3 sm:py-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex-shrink-0">
                                            <img className="w-10 h-10 rounded-full object-cover" src={addr.pnlData.avatar} alt=""/>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">{addr.pnlData.ens || addr.pnlData.name}</p>
                                            <p className="text-sm text-gray-400 truncate font-mono">{addr.address}</p>
                                        </div>
                                        <div className="hidden sm:block text-right">
                                            <p className="text-sm text-gray-400">Win Rate</p>
                                            <p className="text-sm font-medium text-white">{(addr.pnlData.winrate * 100).toFixed(1)}%</p>
                                        </div>
                                         <div className="hidden md:block text-right">
                                            <p className="text-sm text-gray-400">Profit</p>
                                            <p className={`text-sm font-medium ${addr.pnlData.realized_profit > 0 ? 'text-green-400' : 'text-red-400'}`}>${addr.pnlData.realized_profit.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <button onClick={() => onAddressSelect(addr)} className="inline-flex items-center gap-x-2 rounded-md bg-gray-700 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-600">
                                                View
                                                <ChevronLeftIcon className="w-4 h-4 -rotate-180" />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                                ))}
                            </ul>
                        </div>
                    </InfoCard>
                </div>
            </div>
        </div>
    );
};

export default TagDetail;
