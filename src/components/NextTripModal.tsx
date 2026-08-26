import React, { useState, useEffect } from 'react';
import { Database, Search, User, FileText, Globe, Phone, MapPin, Calendar, CheckCircle, AlertCircle, RefreshCw, X, ShieldCheck, Eye, Layers } from 'lucide-react';
import { searchNextTripDatabase, getNextTripStats, SearchResult } from '../lib/nextripDb';
import { motion, AnimatePresence } from 'motion/react';

interface NextTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSearch?: string;
}

export const NextTripModal: React.FC<NextTripModalProps> = ({ isOpen, onClose, initialSearch = '' }) => {
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [stats, setStats] = useState<{ [key: string]: number }>({});
  const [selectedRecord, setSelectedRecord] = useState<SearchResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadStats();
      if (initialSearch) {
        setSearchTerm(initialSearch);
        handleSearch(initialSearch);
      }
    }
  }, [isOpen, initialSearch]);

  const loadStats = async () => {
    try {
      const data = await getNextTripStats();
      setStats(data);
    } catch (e: any) {
      console.warn("Could not load stats:", e);
    }
  };

  const handleSearch = async (termToSearch?: string) => {
    const queryTerm = termToSearch !== undefined ? termToSearch : searchTerm;
    if (!queryTerm.trim()) return;

    setIsSearching(true);
    setErrorMsg(null);
    setHasSearched(true);

    try {
      const found = await searchNextTripDatabase(queryTerm);
      setResults(found);
      if (found.length > 0) {
        setSelectedRecord(found[0]);
      } else {
        setSelectedRecord(null);
      }
    } catch (err: any) {
      console.error("Search error:", err);
      setErrorMsg(err?.message || "Failed to query NexTrip Firebase Database.");
    } finally {
      setIsSearching(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-5xl max-h-[90vh] bg-black/95 border-2 border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.35)] flex flex-col overflow-hidden text-green-400"
        >
          {/* Header */}
          <div className="bg-green-950/80 border-b border-green-500/40 p-3.5 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-green-500 text-black font-bold">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold tracking-wider text-green-300 uppercase">
                    NEXTRIP TRAVELS // DATABASE EXPLORER
                  </h3>
                  <span className="px-2 py-0.5 bg-green-900/80 border border-green-500/60 text-[9px] text-green-300 font-bold uppercase rounded-none">
                    PROJECT: inductive-rhino-107pf
                  </span>
                </div>
                <p className="text-[10px] text-green-600">CLIENT, PASSPORT & BOOKING INTELLIGENCE SYSTEM</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadStats}
                title="Refresh Collections"
                className="p-1.5 border border-green-500/40 hover:bg-green-900/60 text-green-400 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 bg-red-950/80 border border-red-500/60 hover:bg-red-900 text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Toolbar */}
          <div className="p-4 bg-green-950/20 border-b border-green-500/30 flex flex-col md:flex-row gap-3 items-center shrink-0">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-green-600" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by Passport Number (e.g. A01234567, EF...), Name, Phone, or Booking ID..."
                className="w-full bg-black/90 border border-green-500/50 pl-9 pr-4 py-2 text-xs text-green-300 placeholder:text-green-800 focus:outline-none focus:border-green-400 focus:shadow-[0_0_12px_rgba(34,197,94,0.3)] font-mono"
              />
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={isSearching || !searchTerm.trim()}
              className="w-full md:w-auto px-5 py-2 bg-green-500 hover:bg-green-400 text-black font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(34,197,94,0.5)] disabled:opacity-50"
            >
              {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>{isSearching ? 'SEARCHING DB...' : 'QUERY DATABANK'}</span>
            </button>
          </div>

          {/* Connected Collections Badge Bar */}
          <div className="px-4 py-2 bg-black/90 border-b border-green-500/20 flex flex-wrap items-center gap-2 text-[10px] text-green-600 shrink-0">
            <span className="flex items-center gap-1 text-green-400">
              <Layers className="w-3 h-3" />
              <span>COLLECTIONS SCANNED:</span>
            </span>
            {Object.keys(stats).length > 0 ? (
              Object.entries(stats).map(([col, count]) => (
                <span key={col} className="px-2 py-0.5 bg-green-950/60 border border-green-500/30 text-green-300">
                  {col} <strong className="text-green-400">({count})</strong>
                </span>
              ))
            ) : (
              <span className="text-green-700">clients, passports, customers, bookings, visas, users</span>
            )}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-green-500/30">
            {/* Results List */}
            <div className="w-full md:w-2/5 p-3 overflow-y-auto max-h-[50vh] md:max-h-full flex flex-col gap-2">
              <div className="flex items-center justify-between pb-1 text-[10px] text-green-600 uppercase">
                <span>RECORDS FOUND ({results.length})</span>
                {results.length > 0 && <span>SELECT TO INSPECT</span>}
              </div>

              {isSearching ? (
                <div className="flex flex-col items-center justify-center p-8 text-green-500 gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span className="text-xs">Querying inductive-rhino-107pf Firebase...</span>
                </div>
              ) : results.length > 0 ? (
                results.map((rec) => {
                  const isSelected = selectedRecord?.id === rec.id;
                  const name = rec.data.name || rec.data.fullName || rec.data.clientName || rec.data.passengerName || 'Client Document';
                  const passport = rec.data.passport || rec.data.passportNumber || rec.data.passport_no || rec.data.passportNo || rec.data.number || '';
                  const phone = rec.data.phone || rec.data.mobile || rec.data.contact || '';

                  return (
                    <button
                      key={rec.id}
                      onClick={() => setSelectedRecord(rec)}
                      className={`w-full text-left p-2.5 border transition-all flex flex-col gap-1 ${
                        isSelected 
                          ? 'bg-green-900/40 border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.3)] text-green-200' 
                          : 'bg-green-950/20 border-green-500/20 hover:border-green-500/50 text-green-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-green-400 px-1.5 py-0.2 bg-green-950 border border-green-500/40">
                          {rec.collection}
                        </span>
                        <span className="text-[9px] text-green-600 font-mono truncate max-w-[120px]">
                          ID: {rec.id}
                        </span>
                      </div>
                      <div className="font-bold text-xs truncate text-green-300">
                        {name}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-green-500">
                        {passport && (
                          <span className="flex items-center gap-1 text-green-300 font-bold">
                            <FileText className="w-3 h-3 text-green-400" />
                            <span>PP: {passport}</span>
                          </span>
                        )}
                        {phone && (
                          <span className="flex items-center gap-1 text-green-600 truncate">
                            <Phone className="w-2.5 h-2.5" />
                            <span>{phone}</span>
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              ) : hasSearched ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-green-700">
                  <AlertCircle className="w-8 h-8 mb-2 text-yellow-600/70" />
                  <p className="text-xs font-bold text-yellow-500">NO RECORDS FOUND</p>
                  <p className="text-[10px] mt-1 text-green-700">
                    No documents matched &quot;{searchTerm}&quot; in active collections.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center text-green-800">
                  <Search className="w-8 h-8 mb-2 text-green-900" />
                  <p className="text-xs">Type a passport number or name above to search.</p>
                </div>
              )}
            </div>

            {/* Record Detail Inspector */}
            <div className="w-full md:w-3/5 p-4 overflow-y-auto max-h-[50vh] md:max-h-full bg-black/80 flex flex-col">
              <div className="flex items-center justify-between pb-2 border-b border-green-500/30 mb-3">
                <span className="text-[10px] font-bold uppercase text-green-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                  <span>RECORD FIELD DECRYPTION</span>
                </span>
                {selectedRecord && (
                  <span className="text-[9px] text-green-600">
                    COLLECTION: {selectedRecord.collection} // ID: {selectedRecord.id}
                  </span>
                )}
              </div>

              {selectedRecord ? (
                <div className="flex flex-col gap-3">
                  {/* Summary Card */}
                  <div className="p-3 bg-green-950/30 border border-green-500/40 grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9px] text-green-600 uppercase block">Name / Client</span>
                      <span className="text-xs font-bold text-green-200">
                        {selectedRecord.data.name || selectedRecord.data.fullName || selectedRecord.data.passengerName || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-green-600 uppercase block">Passport Number</span>
                      <span className="text-xs font-bold text-green-300">
                        {selectedRecord.data.passport || selectedRecord.data.passportNumber || selectedRecord.data.passportNo || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-green-600 uppercase block">Contact / Phone</span>
                      <span className="text-xs text-green-400">
                        {selectedRecord.data.phone || selectedRecord.data.mobile || selectedRecord.data.contact || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-green-600 uppercase block">Country / Destination</span>
                      <span className="text-xs text-green-400">
                        {selectedRecord.data.country || selectedRecord.data.destination || selectedRecord.data.nationality || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Raw JSON Data */}
                  <div>
                    <span className="text-[9px] text-green-600 uppercase block mb-1 font-bold">
                      &gt; FULL RAW DOCUMENT OBJECT:
                    </span>
                    <pre className="p-3 bg-black border border-green-500/30 text-green-400 text-[11px] font-mono overflow-x-auto whitespace-pre-wrap selection:bg-green-500/30 max-h-72">
                      {JSON.stringify(selectedRecord.data, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-green-800 p-8">
                  <Eye className="w-8 h-8 mb-2 text-green-900" />
                  <p className="text-xs">Select any record from the left list to view decrypted details.</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Info */}
          <div className="bg-green-950/60 px-4 py-2 border-t border-green-500/30 flex items-center justify-between text-[10px] text-green-600">
            <span>DATABASE: FIREBASE FIRESTORE [CONNECTED]</span>
            <span className="text-green-400">STATUS: SECURE_CHANNEL_READY</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
