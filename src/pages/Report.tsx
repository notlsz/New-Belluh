import React from 'react';

const Report: React.FC = () => {
    return (
        <div className="min-h-screen bg-white text-[#111111] selection:bg-slate-200 py-24 px-6 md:px-12 font-serif flex flex-col items-center">
            <div className="max-w-[800px] w-full">
                <header className="mb-24">
                    <p className="text-sm font-sans font-medium text-slate-500 mb-6 tracking-wide uppercase">
                        Belluh Research: Technical Report
                    </p>
                    <h1 className="text-4xl md:text-[52px] font-medium tracking-tight mb-8 leading-[1.1] font-sans">
                        Attractiveness Index: Ivy League & National Distributions
                    </h1>
                    <div className="flex flex-col md:flex-row md:items-center text-sm font-sans text-slate-600 gap-4 md:gap-12 pb-8 border-b border-slate-200">
                        <div>
                            <span className="block text-slate-400 mb-1">Authors</span>
                            <span className="text-slate-900">Belluh Data Science Team</span>
                        </div>
                        <div>
                            <span className="block text-slate-400 mb-1">Date</span>
                            <span className="text-slate-900">June 9, 2026</span>
                        </div>
                        <div>
                            <span className="block text-slate-400 mb-1">Dataset</span>
                            <span className="text-slate-900">n = 33,000 (Anonymized)</span>
                        </div>
                    </div>
                </header>

                <div className="text-[17px] leading-[1.8] text-[#333333] space-y-10">
                    <section>
                        <h2 className="text-sm font-sans font-medium text-slate-900 uppercase tracking-widest mb-4">Abstract</h2>
                        <p className="indent-8">
                            In this technical report, we analyze the distribution of highly rated profiles across collegiate networks. The data is segmented into two primary cohorts: a focused 2,000-user sample exclusively from Ivy League institutions, and a broader 31,000-user national dataset. We present empirical evidence suggesting significant variation in baseline attractiveness scores across institutional boundaries, derived from a composite engagement index.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-sans font-medium tracking-tight mt-16 mb-6 text-[#111]">1. Ivy League Distribution</h2>
                        <p className="mb-8">
                            Based on the 2,000-user Ivy League dataset, we observed distinct variance in baseline attractiveness scores. The following catalog reflects the highest concentration of top-percentile profiles among the studied institutions. Confidence scores are normalized between 0.0 and 1.0.
                        </p>

                        <div className="my-12 font-sans overflow-x-auto">
                            <table className="w-full text-left text-[15px]">
                                <thead>
                                    <tr className="border-y-2 border-slate-900">
                                        <th className="py-3 px-2 font-medium text-slate-900 w-24">Rank</th>
                                        <th className="py-3 px-2 font-medium text-slate-900">Institution</th>
                                        <th className="py-3 px-2 font-medium text-slate-900 text-right">Confidence Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { rank: 1, name: "Yale University", score: "0.92" },
                                        { rank: 2, name: "University of Pennsylvania", score: "0.89" },
                                        { rank: 3, name: "Cornell University", score: "0.87" },
                                        { rank: 4, name: "Princeton University", score: "0.86" },
                                        { rank: 5, name: "Harvard University", score: "0.84" },
                                        { rank: 6, name: "Brown University", score: "0.81" },
                                        { rank: 7, name: "Dartmouth College", score: "0.78" },
                                    ].map((item, idx) => (
                                        <tr key={item.rank} className={`border-b border-slate-200 ${idx === 6 ? 'border-b-2 border-b-slate-900' : ''}`}>
                                            <td className="py-3 px-2 text-slate-500 tabular-nums">{item.rank}</td>
                                            <td className="py-3 px-2 text-slate-900">{item.name}</td>
                                            <td className="py-3 px-2 text-slate-900 text-right tabular-nums">{item.score}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <p className="text-xs text-slate-500 mt-3 caption-bottom">Table 1: Normalized attractiveness density within the Ivy League cohort (n=2,000).</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-sans font-medium tracking-tight mt-20 mb-6 text-[#111]">2. National Distribution Top 10</h2>
                        <p className="mb-8">
                            Expanding the scope to the 31,000-user national dataset, the distribution shifts significantly towards large state institutions and specific private universities known for highly active campus cultures. Demographics suggest geographic clustering along the coastal United States and specific southern corridors.
                        </p>

                        <div className="my-12 font-sans overflow-x-auto">
                            <table className="w-full text-left text-[15px]">
                                <thead>
                                    <tr className="border-y-2 border-slate-900">
                                        <th className="py-3 px-2 font-medium text-slate-900 w-24">Rank</th>
                                        <th className="py-3 px-2 font-medium text-slate-900">Institution</th>
                                        <th className="py-3 px-2 font-medium text-slate-900 text-right">Dataset Representation</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { rank: 1, name: "University of California, Los Angeles (UCLA)", stat: "4.2%" },
                                        { rank: 2, name: "University of Southern California (USC)", stat: "3.9%" },
                                        { rank: 3, name: "Vanderbilt University", stat: "3.5%" },
                                        { rank: 4, name: "University of Miami", stat: "3.4%" },
                                        { rank: 5, name: "Arizona State University", stat: "3.1%" },
                                        { rank: 6, name: "University of Texas at Austin", stat: "2.8%" },
                                        { rank: 7, name: "Tulane University", stat: "2.7%" },
                                        { rank: 8, name: "Florida State University", stat: "2.5%" },
                                        { rank: 9, name: "University of California, Santa Barbara", stat: "2.3%" },
                                        { rank: 10, name: "San Diego State University", stat: "2.1%" },
                                    ].map((item, idx) => (
                                        <tr key={item.rank} className={`border-b border-slate-200 ${idx === 9 ? 'border-b-2 border-b-slate-900' : ''}`}>
                                            <td className="py-3 px-2 text-slate-500 tabular-nums">{item.rank}</td>
                                            <td className="py-3 px-2 text-slate-900">{item.name}</td>
                                            <td className="py-3 px-2 text-slate-900 text-right tabular-nums">{item.stat}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <p className="text-xs text-slate-500 mt-3 caption-bottom">Table 2: Top 10 institutions by peak attractiveness concentration nationally (n=31,000).</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-sans font-medium tracking-tight mt-20 mb-6 text-[#111]">3. Methodology Parameters</h2>
                        <p>
                            Data was collected over a 6-month period from active users. "Attractiveness" in this context is derived from an internal engagement index, which aggregates profile completion rates, qualitative feedback loops (e.g., interaction volume, sustained engagement latency), and opt-in self-reporting within the platform.
                        </p>
                        <p className="mt-4">
                            <strong>Limitations:</strong> The methodology is subject to sample bias reflective of the platform's early demographic distribution and should not be considered an objective sociological measure. All data was anonymized and aggregated prior to analysis to ensure privacy compliance.
                        </p>
                    </section>
                </div>
            </div>
            
            <div className="mt-32 max-w-[800px] w-full mx-auto border-t border-slate-200 pt-8 flex items-center justify-between text-xs font-sans text-slate-500">
                <span>© 2026 Belluh Inc. All rights reserved.</span>
                <a href="/" className="hover:text-[#111] transition-colors">Return Home</a>
            </div>
        </div>
    );
};

export default Report;
