import React from 'react';
import { useI18n, useUi } from '../i18n';
import researchUi from '../i18n/ui/researchReport';

const Report: React.FC = () => {
    const { f, tag, date, num } = useI18n();
    const T = useUi(researchUi);
    const dec = (x: number, d: number) => { try { return x.toLocaleString(tag, { minimumFractionDigits: d, maximumFractionDigits: d }); } catch { return x.toFixed(d); } };
    const pct = (x: number) => { try { return (x / 100).toLocaleString(tag, { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }); } catch { return `${x}%`; } };
    const N = { sample: num(2000), national: num(31000), total: num(33000), min: dec(0, 1), max: dec(1, 1) };
    return (
        <div className="min-h-screen bg-white text-[#111111] selection:bg-slate-200 py-24 px-6 md:px-12 font-serif flex flex-col items-center">
            <div className="max-w-[800px] w-full">
                <header className="mb-24">
                    <p className="text-sm font-sans font-medium text-slate-500 mb-6 tracking-wide uppercase">
                        {T.kicker}
                    </p>
                    <h1 className="text-4xl md:text-[52px] font-medium tracking-tight mb-8 leading-[1.1] font-sans">
                        {T.title}
                    </h1>
                    <div className="flex flex-col md:flex-row md:items-center text-sm font-sans text-slate-600 gap-4 md:gap-12 pb-8">
                        <div>
                            <span className="block text-slate-400 mb-1">{T.authors}</span>
                            <span className="text-slate-900">{T.authorsValue}</span>
                        </div>
                        <div>
                            <span className="block text-slate-400 mb-1">{T.date}</span>
                            <span className="text-slate-900">{date(new Date(2026, 5, 9), { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        <div>
                            <span className="block text-slate-400 mb-1">{T.dataset}</span>
                            <span className="text-slate-900">{f(T.datasetValue, N)}</span>
                        </div>
                    </div>
                </header>

                <div className="text-[17px] leading-[1.8] text-[#333333] space-y-10">
                    <section>
                        <h2 className="text-sm font-sans font-medium text-slate-900 uppercase tracking-widest mb-4">{T.abstract}</h2>
                        <p className="indent-8">
                            {f(T.abstractBody, N)}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-sans font-medium tracking-tight mt-16 mb-6 text-[#111]">{T.s1}</h2>
                        <p className="mb-8">
                            {f(T.s1Body, N)}
                        </p>

                        <div className="my-12 font-sans overflow-x-auto">
                            <table className="w-full text-left text-[15px]">
                                <thead>
                                    <tr>
                                        <th className="py-3 px-2 font-medium text-slate-900 w-24">{T.rank}</th>
                                        <th className="py-3 px-2 font-medium text-slate-900">{T.institution}</th>
                                        <th className="py-3 px-2 font-medium text-slate-900 text-right">{T.confidence}</th>
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
                                        <tr key={item.rank} className={idx % 2 === 0 ? 'bg-slate-50' : ''}>
                                            <td className="py-3 px-2 text-slate-500 tabular-nums">{item.rank}</td>
                                            <td className="py-3 px-2 text-slate-900">{item.name}</td>
                                            <td className="py-3 px-2 text-slate-900 text-right tabular-nums">{dec(Number(item.score), 2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <p className="text-xs text-slate-500 mt-3 caption-bottom">{f(T.table1, N)}</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-sans font-medium tracking-tight mt-20 mb-6 text-[#111]">{T.s2}</h2>
                        <p className="mb-8">
                            {f(T.s2Body, N)}
                        </p>

                        <div className="my-12 font-sans overflow-x-auto">
                            <table className="w-full text-left text-[15px]">
                                <thead>
                                    <tr>
                                        <th className="py-3 px-2 font-medium text-slate-900 w-24">{T.rank}</th>
                                        <th className="py-3 px-2 font-medium text-slate-900">{T.institution}</th>
                                        <th className="py-3 px-2 font-medium text-slate-900 text-right">{T.representation}</th>
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
                                        <tr key={item.rank} className={idx % 2 === 0 ? 'bg-slate-50' : ''}>
                                            <td className="py-3 px-2 text-slate-500 tabular-nums">{item.rank}</td>
                                            <td className="py-3 px-2 text-slate-900">{item.name}</td>
                                            <td className="py-3 px-2 text-slate-900 text-right tabular-nums">{pct(parseFloat(item.stat))}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <p className="text-xs text-slate-500 mt-3 caption-bottom">{f(T.table2, N)}</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-sans font-medium tracking-tight mt-20 mb-6 text-[#111]">{T.s3}</h2>
                        <p>
                            {T.s3Body}
                        </p>
                        <p className="mt-4">
                            <strong>{T.limitations}</strong> {T.limitationsBody}
                        </p>
                    </section>
                </div>
            </div>
            
            <div className="mt-32 max-w-[800px] w-full mx-auto pt-8 flex items-center justify-between text-xs font-sans text-slate-500">
                <span>{f(T.rights, { year: 2026 })}</span>
                <a href="/" className="hover:text-[#111] transition-colors">{T.returnHome}</a>
            </div>
        </div>
    );
};

export default Report;
