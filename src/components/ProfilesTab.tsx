import React, { useState, useEffect } from "react";
import { 
  Users, UserPlus, ClipboardCheck, Trash2, Copy, Download, 
  UserCheck, ShieldAlert, Sparkles, Plus, Check 
} from "lucide-react";
import { Contact } from "../types";

interface ProfilesTabProps {
  address: string;
}

export default function ProfilesTab({ address }: ProfilesTabProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Contact form inputs
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newNote, setNewNote] = useState("");
  const [isCopyTrader, setIsCopyTrader] = useState(false);
  const [isContact, setIsContact] = useState(true);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/contacts");
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newAddress) return;

    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          address: newAddress,
          note: newNote,
          isContact: isContact,
          isCopyTrader: isCopyTrader,
          nickname: newName,
          isFollowing: true
        })
      });

      if (res.ok) {
        setNewName("");
        setNewAddress("");
        setNewNote("");
        setIsCopyTrader(false);
        setIsContact(true);
        fetchContacts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteContact = async (id: string) => {
    try {
      const res = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchContacts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(contacts, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `arc_companion_contacts_ledger.json`);
    dlAnchorElem.click();
  };

  const truncateAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 10)}...${addr.slice(-8)}`;
  };

  // Split contacts by category for crystal-clear section render
  const addressWhitelist = contacts.filter(c => c.isContact && !c.isCopyTrader);
  const copyTradersList = contacts.filter(c => c.isCopyTrader);

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-4 sm:p-6 pb-24 font-sans relative">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Tab Sub header */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">Ecosystem Directory & Watchlist</h1>
              <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider mt-0.5">
                Saved Nodes & Copy-Traders Index
              </p>
            </div>
          </div>

          <button
            id="export-contacts-json"
            onClick={handleExportJSON}
            className="py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-[#60a5fa] hover:text-white border border-white/10 active:scale-95 transition-all text-xs font-bold flex items-center justify-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export Contacts Ledger</span>
          </button>
        </div>

        {/* Outer connected address display */}
        <div className="p-6 rounded-3xl bg-[#091024] border border-blue-500/10 block relative select-all transition-all">
          <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400">Connected Wallet Signature Identity</span>
          <div className="text-sm font-mono mt-1 w-full truncate text-white">{address}</div>
        </div>

        {/* Profile management grids */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Form input - Add New Contact / Whitelist */}
          <div className="md:col-span-1 p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#60a5fa] font-black pb-2 border-b border-white/5">
              <UserPlus className="w-4 h-4" />
              Add New Node Entry
            </div>

            <form onSubmit={handleCreateContact} className="space-y-3 text-xs leading-relaxed">
              <div className="space-y-1">
                <label className="text-gray-400 font-semibold">Contact Ident Name</label>
                <input
                  id="contact-name-input"
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Musa, Sarah, Whale Alpha"
                  className="w-full p-2.5 bg-black border border-white/10 focus:border-blue-500 rounded-lg outline-none text-white font-sans text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-400 font-semibold">Web3 Wallet Address (0x)</label>
                <input
                  id="contact-address-input"
                  type="text"
                  required
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full p-2.5 bg-black border border-white/10 focus:border-blue-500 rounded-lg outline-none text-white font-mono text-xs animate-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-400 font-semibold">Internal Memo / Notes</label>
                <textarea
                  id="contact-note-input"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Memo tag..."
                  className="w-full p-2.5 bg-black border border-white/10 focus:border-blue-500 rounded-lg outline-none text-white font-sans text-xs h-16 resize-none"
                />
              </div>

              {/* Checkbox selector */}
              <div className="space-y-1 border-t border-white/5 pt-2 flex flex-col gap-1 text-[11px] font-bold">
                <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                  <input
                    id="is-trusted-checkbox"
                    type="checkbox"
                    checked={isContact}
                    onChange={(e) => setIsContact(e.target.checked)}
                    className="rounded bg-black border-white/10 text-blue-500 focus:ring-0"
                  />
                  <span>Trusted Contact (Recipient Whitelist)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                  <input
                    id="is-copytrader-checkbox"
                    type="checkbox"
                    checked={isCopyTrader}
                    onChange={(e) => setIsCopyTrader(e.target.checked)}
                    className="rounded bg-black border-white/10 text-orange-500 focus:ring-0"
                  />
                  <span>Add to Copy-Trader Watchlist</span>
                </label>
              </div>

              <button
                id="submit-contact-btn"
                type="submit"
                className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 active:scale-95 transition-all text-black font-extrabold rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Save Node Registry</span>
              </button>
            </form>
          </div>

          {/* Contacts / Whitelist Board Column */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Whitelisted address panel */}
            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-3.5">
              <h3 className="text-xs uppercase tracking-widest text-gray-400 font-bold pl-0.5">
                Saved Whitelisted Contacts (Resolvable by AI agent)
              </h3>

              <div className="space-y-2">
                {addressWhitelist.length === 0 ? (
                  <p className="p-4 text-center text-xs text-gray-500 italic">No trusted contacts whitelist recorded.</p>
                ) : (
                  addressWhitelist.map((c) => (
                    <div key={c.id} className="p-3 bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 rounded-xl flex items-center justify-between text-xs transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <UserCheck className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-100">{c.name}</div>
                          <div className="text-[10px] text-gray-500 font-mono mt-0.5">{truncateAddress(c.address)}</div>
                          {c.note && <div className="text-[10px] text-blue-300/80 italic mt-0.5">&quot;{c.note}&quot;</div>}
                        </div>
                      </div>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleCopy(c.address, c.id)}
                          className="p-1.5 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-white"
                          title="Copy Address"
                        >
                          {copiedId === c.id ? <ClipboardCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDeleteContact(c.id)}
                          className="p-1.5 hover:bg-rose-500/10 rounded transition-colors text-gray-400 hover:text-rose-400"
                          title="Delete Node"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Copy Trader list panel */}
            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-3.5">
              <h3 className="text-xs uppercase tracking-widest text-gray-500 font-bold pl-0.5 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                Copy-Trader Watchlist & Monitor Matrix
              </h3>

              <div className="space-y-2">
                {copyTradersList.length === 0 ? (
                  <p className="p-4 text-center text-xs text-gray-500 italic">No copy trader indicators configured in monitors.</p>
                ) : (
                  copyTradersList.map((c) => (
                    <div key={c.id} className="p-3 bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 rounded-xl flex items-center justify-between text-xs transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-orange-400" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-100">{c.nickname || c.name}</div>
                          <div className="text-[10px] text-gray-500 font-mono mt-0.5">{truncateAddress(c.address)}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* follow toggle button as specified by spec */}
                        <div className="py-1 px-2.5 rounded bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" /> FOLLOWING
                        </div>
                        <button
                          onClick={() => handleDeleteContact(c.id)}
                          className="p-1.5 hover:bg-rose-500/10 rounded transition-colors text-gray-400 hover:text-rose-400"
                          title="Unfollow & Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
