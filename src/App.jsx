import Dashboard from './Dashboard';
import React, { useState, useEffect } from 'react';
import { 
  Wheat, PawPrint, TrendingUp, Plus, Trash2, 
  DollarSign, Download, LogOut, ClipboardList, Package, LayoutDashboard
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  onAuthStateChanged, signOut, updateProfile
} from 'firebase/auth';
import { 
  getFirestore, collection, doc, setDoc, addDoc, onSnapshot, deleteDoc, query, orderBy, limit, getDoc 
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'agrifeed-pro-v1';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login'); 
  const [inventory, setInventory] = useState([]);
  const [groups, setGroups] = useState([]);
  const [logs, setLogs] = useState([]);
  const [agreedToBTA, setAgreedToBTA] = useState(false);
  const [showBTA, setShowBTA] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const userPath = ['artifacts', appId, 'users', user.uid];
    const unsubInv = onSnapshot(collection(db, ...userPath, 'inventory'), (s) => setInventory(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubGroups = onSnapshot(collection(db, ...userPath, 'groups'), (s) => setGroups(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubLogs = onSnapshot(query(collection(db, ...userPath, 'logs'), orderBy('timestamp', 'desc'), limit(50)), (s) => setLogs(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubInv(); unsubGroups(); unsubLogs(); };
  }, [user]);

  const confirmDelete = async (path, id) => {
    if (window.confirm("Are you sure? This data cannot be recovered.")) {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, path, id));
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    try {
      if (authMode === 'signup') {
        if (!agreedToBTA) {
          alert("Please agree to the Beta Testing Agreement to continue.");
          return;
        }

        const whitelistRef = doc(db, "authorized_users", email.toLowerCase());
        const whitelistSnap = await getDoc(whitelistRef);

        if (!whitelistSnap.exists() || whitelistSnap.data().status !== 'approved') {
          alert("Unauthorized: This email is not on the Alpha Testing list. Please contact Cyber Sanctum for access.");
          return;
        }

        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: e.target.farmName.value });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) { alert(err.message); }
  };

  const addItem = async (e) => {
    e.preventDefault();
    const userPath = ['artifacts', appId, 'users', user.uid];
    await addDoc(collection(db, ...userPath, 'inventory'), {
      name: e.target.name.value,
      costPerUnit: parseFloat(e.target.cost.value),
      unit: e.target.unit.value.toUpperCase()
    });
    e.target.reset();
  };

  const addGroup = async (e) => {
    e.preventDefault();
    const userPath = ['artifacts', appId, 'users', user.uid];
    await addDoc(collection(db, ...userPath, 'groups'), {
      name: e.target.name.value,
      headCount: parseInt(e.target.count.value),
      dailyRevenue: parseFloat(e.target.rev.value)
    });
    e.target.reset();
  };

  const logFeeding = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    await addDoc(collection(db, ...userPath, 'logs'), {
      groupId: formData.get('groupId'),
      feedId: formData.get('feedId'),
      logType: formData.get('logType'),
      bunkScore: formData.get('bunkScore') || null, // Capture the score!
      amount: parseFloat(formData.get('amount')),
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0]
      });
    const userPath = ['artifacts', appId, 'users', user.uid];
    const now = new Date();
    
    await addDoc(collection(db, ...userPath, 'logs'), {
      groupId: formData.get('groupId'),
      feedId: formData.get('feedId'),
      amount: parseFloat(formData.get('amount')),
      logType: formData.get('logType'), // refill, consumption, or audit
      timestamp: now.toISOString(),
      date: now.toISOString().split('T')[0] // Stores as "2026-05-12"
    });
    e.target.reset();
  };

 const calculateMargin = (group) => {
    // 1. Get logs just for this pen, sorted by time
    const groupLogs = logs
      .filter(l => l.groupId === group.id)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // 2. Find the most recent "Audit" (This is our 'known' starting point)
    const lastAudit = groupLogs.find(l => l.logType === 'audit');
    const lastAuditTime = lastAudit ? new Date(lastAudit.timestamp) : new Date(0);

    // 3. Find all "Refills" that happened SINCE that audit
    const refillsSinceAudit = groupLogs.filter(l => 
      l.logType === 'refill' && new Date(l.timestamp) > lastAuditTime
    );

    // 4. Calculate Total Consumption cost
    // If we have an audit, we assume the 'Audit amount' is still in the bin, 
    // so we only charge for what was consumed (Daily Feeding logs).
    const feedCost = groupLogs.reduce((acc, log) => {
      const item = inventory.find(i => i.id === log.feedId);
      if (!item) return acc;
      
      // For now, we sum 'consumption' logs. 
      // In a 'Bulk' mode, we'd calculate: (Refills) - (Current Audit)
      if (log.logType === 'consumption') {
        return acc + (item.costPerUnit * log.amount);
      }
      return acc;
    }, 0);

    return (group.headCount * group.dailyRevenue) - feedCost;
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#0a0f0d] text-emerald-500 font-black italic uppercase">System Initializing...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0f0d] flex items-center justify-center p-6 text-white font-sans">
        <div className="w-full max-w-md bg-black border-2 border-emerald-900/30 p-8 rounded-[2.5rem] shadow-2xl relative">
          <div className="text-center mb-10">
            <Wheat className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h1 className="text-4xl font-black italic uppercase tracking-tighter">AgriFeed Pro</h1>
          </div>
          <form onSubmit={handleAuth} className="space-y-6">
            {authMode === 'signup' && (
              <>
                <input required name="farmName" placeholder="Farm Name" className="w-full bg-[#111] border-2 border-emerald-900/30 rounded-2xl p-4 text-white font-bold outline-none focus:border-emerald-500" />
                <div className="flex items-start gap-3 px-2">
                   <input 
                    required 
                    type="checkbox" 
                    checked={agreedToBTA}
                    onChange={(e) => setAgreedToBTA(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-emerald-500 rounded border-emerald-900/30" 
                    />
                    <label className="text-[10px] uppercase font-black text-emerald-900/60 leading-tight">
                    I agree to the <button type="button" onClick={() => setShowBTA(true)} className="text-emerald-500 underline">Beta Testing Agreement</button>
                    </label>
                </div>
              </>
            )}
            <input required name="email" type="email" placeholder="Email" className="w-full bg-[#111] border-2 border-emerald-900/30 rounded-2xl p-4 text-white font-bold outline-none focus:border-emerald-500" />
            <input required name="password" type="password" placeholder="Password" className="w-full bg-[#111] border-2 border-emerald-900/30 rounded-2xl p-4 text-white font-bold outline-none focus:border-emerald-500" />
            <button type="submit" className="w-full bg-emerald-500 text-black font-black py-5 rounded-2xl uppercase shadow-lg">
              {authMode === 'login' ? 'Login' : 'Create Profile'}
            </button>
          </form>
          <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="mt-8 text-emerald-400 text-xs font-black uppercase w-full">
            {authMode === 'login' ? "Need an account? Sign Up" : "Have an account? Login"}
          </button>

          {/* BTA MODAL IN LOGIN VIEW */}
          {showBTA && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-white/20 rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                <div className="p-6 overflow-y-auto">
                  <h2 className="text-xl font-bold text-white mb-4">Beta Testing Agreement</h2>
                  <div className="text-sm text-white/70 space-y-4">
                     <p>This software is provided "as-is" for alpha testing purposes. Cyber Sanctum makes no warranties regarding data persistence or accuracy during this phase.</p>
                  </div>
                </div>
                <div className="p-4 border-t border-white/10 flex justify-end">
                  <button onClick={() => setShowBTA(false)} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium">Close</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#0a0f0d] text-white">
      <nav className="bg-black border-r border-emerald-900/30 w-full md:w-64 p-8 flex flex-col gap-4">
        <div className="mb-6">
            <h2 className="font-black text-xl italic uppercase text-emerald-500">AgriFeed Pro</h2>
            <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">{user.displayName}</p>
        </div>
        <button onClick={() => setActiveTab('dashboard')} className={`p-4 rounded-xl font-black text-left flex items-center gap-3 ${activeTab === 'dashboard' ? 'bg-emerald-500 text-black' : 'text-white/60 hover:text-white'}`}><LayoutDashboard size={18}/> DASHBOARD</button>
        <button onClick={() => setActiveTab('inventory')} className={`p-4 rounded-xl font-black text-left flex items-center gap-3 ${activeTab === 'inventory' ? 'bg-emerald-500 text-black' : 'text-white/60 hover:text-white'}`}><Package size={18}/> WAREHOUSE</button>
        <button onClick={() => setActiveTab('logs')} className={`p-4 rounded-xl font-black text-left flex items-center gap-3 ${activeTab === 'logs' ? 'bg-emerald-500 text-black' : 'text-white/60 hover:text-white'}`}><ClipboardList size={18}/> FEED LOGS</button>
        <button onClick={() => setActiveTab('margins')} className={`p-4 rounded-xl font-black text-left flex items-center gap-3 ${activeTab === 'margins' ? 'bg-emerald-500 text-black' : 'text-white/60 hover:text-white'}`}><TrendingUp size={18}/> NET PROFIT</button>
        <button onClick={() => signOut(auth)} className="mt-auto p-4 text-red-500 font-black uppercase text-xs flex items-center gap-2 hover:bg-red-500/10 rounded-xl transition-all"><LogOut size={14}/> Sign Out</button>
      </nav>

    <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <h1 className="text-6xl font-black italic uppercase tracking-tighter">{user.displayName}</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Dashboard logs={logs} inventory={inventory} />
              
              {/* This is the box we kept from the old version */}
              <div className="bg-black border-2 border-emerald-900/30 p-8 rounded-[2rem]">
                <p className="text-emerald-500 text-xs font-black uppercase mb-2">Active Logs</p>
                <p className="text-5xl font-black italic">{logs.length}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-8">
            <h2 className="text-4xl font-black italic uppercase">Warehouse</h2>
            <form onSubmit={addItem} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-black border-2 border-emerald-900/30 p-8 rounded-[2rem]">
              <input required name="name" placeholder="Ingredient" className="bg-[#111] p-4 rounded-xl border-2 border-transparent focus:border-emerald-500 outline-none text-white" />
              <input required name="cost" type="number" step="0.01" placeholder="Cost ($)" className="bg-[#111] p-4 rounded-xl border-2 border-transparent focus:border-emerald-500 outline-none text-white" />
              <input required name="unit" placeholder="Unit (LB/TON)" className="bg-[#111] p-4 rounded-xl border-2 border-transparent focus:border-emerald-500 outline-none text-white" />
              <button className="bg-emerald-500 text-black font-black rounded-xl uppercase hover:scale-105 transition-transform">Add Stock</button>
            </form>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inventory.map(item => (
                <div key={item.id} className="bg-black border-2 border-emerald-900/30 p-6 rounded-2xl flex justify-between items-center">
                  <div>
                    <p className="text-xl font-black uppercase italic leading-none">{item.name}</p>
                    <p className="text-xs text-emerald-500 font-black mt-2 tracking-widest">${item.costPerUnit} / {item.unit}</p>
                  </div>
                  <button onClick={() => confirmDelete('inventory', item.id)} className="text-red-900 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-8">
            <div className="flex justify-between items-end">
              <h2 className="text-4xl font-black italic uppercase">Feeding Logs</h2>
              <p className="text-emerald-500/50 text-[10px] font-black uppercase tracking-[0.2em]">Bunks & Bins Tracking</p>
            </div>
            
            {/* FEEDING ENTRY FORM */}
            <form onSubmit={logFeeding} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 bg-black border-2 border-emerald-900/30 p-8 rounded-[2rem]">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase text-white/30 ml-2">Location</label>
                <select name="groupId" required className="bg-[#111] p-4 rounded-xl border-2 border-transparent focus:border-emerald-500 outline-none text-white font-bold appearance-none">
                  <option value="">Select Pen</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase text-white/30 ml-2">Ration/Feed</label>
                <select name="feedId" required className="bg-[#111] p-4 rounded-xl border-2 border-transparent focus:border-emerald-500 outline-none text-white font-bold appearance-none">
                  <option value="">Select Feed</option>
                  {inventory.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase text-white/30 ml-2">Log Type</label>
                <select name="logType" required className="bg-[#111] p-4 rounded-xl border-2 border-transparent focus:border-emerald-500 outline-none text-white font-bold text-xs uppercase appearance-none">
                  <option value="consumption">Daily Bunk Feed</option>
                  <option value="refill">Tank/Bin Refill</option>
                  <option value="audit">Tank/Bin Audit</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase text-white/30 ml-2">Bunk Score (Opt)</label>
                <select name="bunkScore" className="bg-[#111] p-4 rounded-xl border-2 border-transparent focus:border-emerald-500 text-white text-xs font-bold uppercase appearance-none">
                  <option value="">No Score</option>
                  <option value="0">0 - Slickside</option>
                  <option value="1">1 - Scattered</option>
                  <option value="2">2 - Heavy Leftover</option>
                  <option value="3">3 - Overfed</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase text-white/30 ml-2">Amount</label>
                <input required name="amount" type="number" step="0.01" placeholder="0.00" className="bg-[#111] p-4 rounded-xl border-2 border-transparent focus:border-emerald-500 outline-none text-white font-bold" />
              </div>

              <div className="flex flex-col gap-2 justify-end">
                <button className="bg-emerald-500 text-black font-black h-[58px] rounded-xl uppercase flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-lg shadow-emerald-500/10">
                  <Plus size={18}/> Log Entry
                </button>
              </div>
            </form>

            {/* LOG HISTORY */}
            <div className="space-y-3">
              {logs.map(log => {
                const g = groups.find(x => x.id === log.groupId);
                const i = inventory.find(x => x.id === log.feedId);
                const isRefill = log.logType === 'refill';
                const isAudit = log.logType === 'audit';
                
                return (
                  <div key={log.id} className="bg-black/40 border border-white/5 p-5 rounded-2xl flex justify-between items-center group hover:border-emerald-500/30 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${isRefill ? 'bg-blue-500' : isAudit ? 'bg-amber-500' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}></div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{log.date || 'Today'}</span>
                            {log.bunkScore && (
                              <span className="bg-white/5 text-[9px] px-2 py-0.5 rounded text-white/50 font-black uppercase">Score: {log.bunkScore}</span>
                            )}
                          </div>
                          <span className="font-black uppercase italic text-sm tracking-tight">
                              {g?.name || 'Unknown Pen'} 
                              <span className={`${isRefill ? 'text-blue-500' : isAudit ? 'text-amber-500' : 'text-emerald-500/50'} mx-2 uppercase text-[10px] not-italic font-black`}>
                                {isRefill ? 'Refilled' : isAudit ? 'Audited' : 'Consumed'}
                              </span> 
                              {log.amount} {i?.unit || 'Units'} <span className="text-white/20 italic lowercase mx-1">of</span> {i?.name || 'Feed'}
                          </span>
                        </div>
                    </div>
                    <button onClick={() => confirmDelete('logs', log.id)} className="text-white/5 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'margins' && (
          <div className="space-y-8">
            <h2 className="text-4xl font-black italic uppercase">Net Profit Analysis</h2>
            <form onSubmit={addGroup} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-black border-2 border-emerald-900/30 p-8 rounded-[2rem]">
              <input required name="name" placeholder="Pen/House Name" className="bg-[#111] p-4 rounded-xl outline-none text-white" />
              <input required name="count" type="number" placeholder="Head Count" className="bg-[#111] p-4 rounded-xl outline-none text-white" />
              <input required name="rev" type="number" step="0.01" placeholder="Daily Rev/Head ($)" className="bg-[#111] p-4 rounded-xl outline-none text-white" />
              <button className="bg-emerald-500 text-black font-black rounded-xl uppercase">Track Pen</button>
            </form>
            <div className="grid grid-cols-1 gap-4">
                {groups.map(g => {
                const actual = calculateMargin(g);
                return (
                    <div key={g.id} className="bg-black border-2 border-emerald-900/30 p-8 rounded-[2rem] flex justify-between items-center">
                    <div>
                        <p className="text-3xl font-black uppercase italic leading-none tracking-tighter">{g.name}</p>
                        <p className="text-[10px] font-black text-white/30 mt-3 uppercase tracking-[0.2em]">Daily Potential: ${(g.headCount * g.dailyRevenue).toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-1">Actual Net Profit</p>
                        <p className={`text-4xl font-black italic ${actual < 0 ? 'text-red-500' : 'text-emerald-400'}`}>
                        ${actual.toFixed(2)}
                        </p>
                    </div>
                    <button onClick={() => confirmDelete('groups', g.id)} className="ml-6 text-white/10 hover:text-red-500"><Trash2 size={20}/></button>
                    </div>
                );
                })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
