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
  getFirestore, collection, doc, setDoc, addDoc, onSnapshot, deleteDoc, query, orderBy, limit 
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCDqBHlLIqXblDsyd_Kq4roZioCejJjG-4",
  authDomain: "agrifeed-pro.firebaseapp.com",
  projectId: "agrifeed-pro",
  storageBucket: "agrifeed-pro.firebasestorage.app",
  messagingSenderId: "705398190810",
  appId: "1:705398190810:web:764848553b8a083c62ebe3"
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
    const userPath = ['artifacts', appId, 'users', user.uid];
    await addDoc(collection(db, ...userPath, 'logs'), {
      groupId: e.target.groupId.value,
      feedId: e.target.feedId.value,
      amount: parseFloat(e.target.amount.value),
      timestamp: new Date().toISOString()
    });
    e.target.reset();
  };

  const calculateMargin = (group) => {
    const groupLogs = logs.filter(l => l.groupId === group.id);
    const feedCost = groupLogs.reduce((acc, log) => {
      const item = inventory.find(i => i.id === log.feedId);
      return acc + (item ? item.costPerUnit * log.amount : 0);
    }, 0);
    return (group.headCount * group.dailyRevenue) - feedCost;
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#0a0f0d] text-emerald-500 font-black italic">SYSTEM INITIALIZING...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0f0d] flex items-center justify-center p-6 text-white font-sans">
        <div className="w-full max-w-md bg-black border-2 border-emerald-900/30 p-8 rounded-[2.5rem] shadow-2xl">
          <div className="text-center mb-10">
            <Wheat className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h1 className="text-4xl font-black italic uppercase tracking-tighter">AgriFeed Pro</h1>
          </div>
          <form onSubmit={handleAuth} className="space-y-6">
            {authMode === 'signup' && (
              <input required name="farmName" placeholder="Farm Name" className="w-full bg-[#111] border-2 border-emerald-900/30 rounded-2xl p-4 text-white font-bold outline-none focus:border-emerald-500" />
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
              <div className="bg-black border-2 border-emerald-900/30 p-8 rounded-[2rem]">
                <p className="text-emerald-500 text-xs font-black uppercase mb-2">Total Populations</p>
                <p className="text-5xl font-black italic">{groups.length}</p>
              </div>
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
              <input required name="name" placeholder="Ingredient" className="bg-[#111] p-4 rounded-xl border-2 border-transparent focus:border-emerald-500 outline-none" />
              <input required name="cost" type="number" step="0.01" placeholder="Cost ($)" className="bg-[#111] p-4 rounded-xl border-2 border-transparent focus:border-emerald-500 outline-none" />
              <input required name="unit" placeholder="Unit (LB/TON)" className="bg-[#111] p-4 rounded-xl border-2 border-transparent focus:border-emerald-500 outline-none" />
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
            <h2 className="text-4xl font-black italic uppercase">Feeding Logs</h2>
            <form onSubmit={logFeeding} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-black border-2 border-emerald-900/30 p-8 rounded-[2rem]">
              <select name="groupId" className="bg-[#111] p-4 rounded-xl border-2 border-transparent focus:border-emerald-500 outline-none">
                <option value="">Select Pen</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <select name="feedId" className="bg-[#111] p-4 rounded-xl border-2 border-transparent focus:border-emerald-500 outline-none">
                <option value="">Select Feed</option>
                {inventory.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
              <input required name="amount" type="number" step="0.01" placeholder="Amount" className="bg-[#111] p-4 rounded-xl border-2 border-transparent focus:border-emerald-500 outline-none" />
              <button className="bg-emerald-500 text-black font-black rounded-xl uppercase flex items-center justify-center gap-2 hover:scale-105 transition-transform"><Plus size={18}/> Log Feed</button>
            </form>
            <div className="space-y-3">
              {logs.map(log => {
                const g = groups.find(x => x.id === log.groupId);
                const i = inventory.find(x => x.id === log.feedId);
                return (
                  <div key={log.id} className="bg-black/40 border border-white/5 p-5 rounded-2xl flex justify-between items-center group">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span className="font-black uppercase italic text-sm tracking-tight">
                            {g?.name || 'Deleted Pen'} <span className="text-emerald-500/50 mx-2">consumed</span> {log.amount} {i?.unit || 'Units'} <span className="text-emerald-500/50 mx-2">of</span> {i?.name || 'Deleted Ingredient'}
                        </span>
                    </div>
                    <button onClick={() => confirmDelete('logs', log.id)} className="text-white/10 group-hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
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
              <input required name="name" placeholder="Pen/House Name" className="bg-[#111] p-4 rounded-xl outline-none" />
              <input required name="count" type="number" placeholder="Head Count" className="bg-[#111] p-4 rounded-xl outline-none" />
              <input required name="rev" type="number" step="0.01" placeholder="Daily Rev/Head ($)" className="bg-[#111] p-4 rounded-xl outline-none" />
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
