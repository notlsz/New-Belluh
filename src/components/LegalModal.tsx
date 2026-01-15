
import React, { useRef } from 'react';
import { X, FileText, Shield, ArrowRight } from 'lucide-react';
import { TOS_TEXT } from '../data/Terms';
import { PRIVACY_POLICY_TEXT } from '../data/PrivacyPolicy';

interface LegalModalProps {
  type: 'tos' | 'privacy';
  onClose: () => void;
}

const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const rawContent = type === 'tos' ? TOS_TEXT : PRIVACY_POLICY_TEXT;
  const title = type === 'tos' ? 'Terms of Service' : 'Privacy Policy';
  const lastUpdated = "December 9, 2025";

  const scrollToSection = (id: string) => {
      const element = document.getElementById(id);
      if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
  };

  const renderContent = (text: string) => {
    const lines = text.split('\n');
    const elements = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        elements.push(<div key={`spacer-${i}`} className="h-4" />);
        continue;
      }

      // 1. CHART RENDERING LOGIC
      // Check if line looks like "Category: Collected (Yes), Sold/Shared (No)"
      // Identifiers (Name, email, IP, device ID): Collected (Yes), Sold/Shared (No*)
      if (line.includes(": Collected (")) {
         const tableRows = [line];
         let j = i + 1;
         // Look ahead for more table rows
         while (j < lines.length && lines[j].trim().includes(": Collected (")) {
             tableRows.push(lines[j].trim());
             j++;
         }
         i = j - 1; // Skip ahead in main loop

         elements.push(
             <div key={`table-${i}`} className="my-8 border border-slate-200 rounded-xl overflow-hidden shadow-sm animate-fade-in">
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                            <tr>
                                <th className="px-6 py-3 whitespace-nowrap">Category</th>
                                <th className="px-6 py-3 whitespace-nowrap">Collected</th>
                                <th className="px-6 py-3 whitespace-nowrap">Sold/Shared</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {tableRows.map((row, idx) => {
                                // Parse the row
                                const parts = row.split(': ');
                                const category = parts[0];
                                const dataPart = parts[1] || "";
                                
                                const collectedMatch = dataPart.match(/Collected \((.*?)\)/);
                                const soldMatch = dataPart.match(/Sold\/Shared \((.*?)\)/);
                                
                                const collected = collectedMatch ? collectedMatch[1] : "-";
                                const sold = soldMatch ? soldMatch[1] : "-";

                                return (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-3 font-medium text-slate-700">{category}</td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${collected.startsWith('Yes') ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {collected}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${sold.includes('No') ? 'bg-slate-100 text-slate-500' : 'bg-amber-50 text-amber-700'}`}>
                                                {sold}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                 </div>
             </div>
         );
         continue;
      }
      
      // 2. HEADER RENDERING LOGIC (with ID generation)
      // Main Section Headers (e.g., "1. INTRODUCTION")
      if (/^\d+\.\s+[A-Z\s]+$/.test(line) || (/^[A-Z\s]+$/.test(line) && line.length < 60 && line.length > 3)) {
        const id = line.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        elements.push(
          <h3 id={id} key={`h3-${i}`} className="text-xl font-serif font-bold text-slate-900 mt-10 mb-4 tracking-tight border-b border-slate-100 pb-2 scroll-mt-6">
            {line}
          </h3>
        );
        continue;
      }
      
      // Sub-headers (e.g., "4.1 Account Creation")
      if (/^\d+\.\d+/.test(line)) {
        const id = line.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        elements.push(
          <h4 id={id} key={`h4-${i}`} className="text-lg font-semibold text-slate-800 mt-6 mb-2 scroll-mt-6">
            {line}
          </h4>
        );
        continue;
      }

      // List items or specific highlighted lines
      if (line.startsWith('•') || line.startsWith('-')) {
         elements.push(
             <li key={`li-${i}`} className="ml-4 pl-2 border-l-2 border-slate-200 text-slate-600 mb-2 text-[15px] leading-relaxed list-none">
                 {line.replace(/^[•-]\s*/, '')}
             </li>
         )
         continue;
      }

      // Caps lines that look like emphasis
      if (line === line.toUpperCase() && line.length > 10 && !line.includes('.')) {
         elements.push(<p key={`caps-${i}`} className="font-bold text-xs uppercase tracking-widest text-slate-500 mt-6 mb-2">{line}</p>);
         continue;
      }

      // Standard Paragraph
      elements.push(
        <p key={`p-${i}`} className="text-slate-600 text-[16px] leading-relaxed mb-3 font-sans opacity-90">
          {line}
        </p>
      );
    }
    
    return elements;
  };

  // Determine scroll targets based on modal type
  const navTargets = type === 'tos' 
    ? {
        general: '1-acceptance-of-terms',
        userData: '5-user-content-and-data',
        aiUsage: '7-ai-generated-insights-and-disclaimers'
      }
    : {
        general: '1-introduction',
        userData: '2-information-we-collect',
        aiUsage: '3-how-we-use-your-information' // Or section 3.2 specifically if preferred
      };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4 animate-fade-in" onClick={onClose}>
       <div 
         className="bg-white w-full h-full sm:h-[90vh] sm:max-w-5xl sm:rounded-[2rem] shadow-2xl flex flex-col md:flex-row overflow-hidden ring-1 ring-black/5"
         onClick={e => e.stopPropagation()}
       >
           {/* Sidebar / Header */}
           <div className="bg-slate-50 border-b md:border-b-0 md:border-r border-slate-100 p-8 md:w-80 flex-shrink-0 flex flex-col justify-between">
                <div>
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-900 mb-6 shadow-sm border border-slate-200/60">
                        {type === 'tos' ? <FileText size={24} strokeWidth={1.5} /> : <Shield size={24} strokeWidth={1.5} />}
                    </div>
                    <h2 className="text-2xl font-semibold text-slate-900 tracking-tight mb-2">{title}</h2>
                    <p className="text-xs font-medium text-slate-400">Last updated: {lastUpdated}</p>
                    
                    <div className="mt-10 hidden md:block">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Jump To Section</p>
                        <div className="space-y-1">
                            <button 
                                onClick={() => scrollToSection(navTargets.general)}
                                className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white hover:shadow-sm transition-all"
                            >
                                <ArrowRight size={12} className="opacity-50" /> <span>General Terms</span>
                            </button>
                            <button 
                                onClick={() => scrollToSection(navTargets.userData)}
                                className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white hover:shadow-sm transition-all"
                            >
                                <ArrowRight size={12} className="opacity-50" /> <span>User Data</span>
                            </button>
                            <button 
                                onClick={() => scrollToSection(navTargets.aiUsage)}
                                className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white hover:shadow-sm transition-all"
                            >
                                <ArrowRight size={12} className="opacity-50" /> <span>AI Usage</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="hidden md:block">
                     <button onClick={onClose} className="text-sm font-semibold text-slate-400 hover:text-slate-900 transition-colors flex items-center gap-2 px-1 py-2">
                         Close Document <X size={14} />
                     </button>
                </div>
                
                {/* Mobile Close Button */}
                <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white rounded-full shadow-sm border border-slate-100 md:hidden text-slate-500">
                    <X size={20} />
                </button>
           </div>

           {/* Content Area */}
           <div ref={contentRef} className="flex-1 overflow-y-auto bg-white relative scroll-smooth scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
               <div className="max-w-3xl mx-auto p-8 md:p-16 pb-32">
                   {renderContent(rawContent)}
                   
                   <div className="mt-20 pt-10 border-t border-slate-100 flex flex-col items-center justify-center text-center">
                       <div className="w-12 h-1 bg-slate-100 rounded-full mb-6"></div>
                       <p className="text-slate-400 text-sm mb-8">End of document.</p>
                       <button 
                         onClick={onClose}
                         className="px-8 py-3 bg-slate-900 text-white rounded-full font-bold text-sm hover:bg-black transition-transform active:scale-95 shadow-lg"
                        >
                           I Understand
                       </button>
                   </div>
               </div>
           </div>
       </div>
    </div>
  );
}
export default LegalModal;