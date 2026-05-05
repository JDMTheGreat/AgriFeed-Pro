import React, { useState, useEffect } from 'react';
import { 
  Wheat, PawPrint, TrendingUp, Plus, Trash2, 
  DollarSign, Download, LogOut, ClipboardList, AlertTriangle
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
    const unsubLogs = onSnapshot(query(collection(db, ...userPath, 'logs'), orderBy('timestamp', 'desc'), limit(10)), (s) => setLogs(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubInv(); unsubGroups(); unsubLogs(); };
  }, [user]);

  const confirmDelete = async (path, id) => {
    if (window.confirm("Are you sure? This data cannot be recovered.")) {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, path, id));
    }
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

  // Logic for UI calculations
  const calculateMargin = (group) => {
    const groupLogs = logs.filter(l => l.groupId === group.id);
    const feedCost = groupLogs.reduce((acc, log) => {
      const item = inventory.find(i => i.id === log.feedId);
      return acc + (item ? item.costPerUnit * log.amount : 0);
    }, 0);
    return (group.headCount * group.dailyRevenue) - feedCost;
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-emerald-500 font-bold italic">LOADING...</div>;

  if (!user) {
    // ... (Login UI remains same as previous version)
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#0a0f0d] text-white">
      {/* Sidebar Navigation */}
      <nav className="bg-black border-r border-emerald-900/30 w-full md:w-64 p-8 flex flex-col gap-4">
        <h2 className="font-black text-xl italic uppercase text-emerald-500">AgriFeed Pro</h2>
        <button onClick={() => setActiveTab('dashboard')} className={`p-4 rounded-xl font-bold text-left ${activeTab === 'dashboard' ? 'bg-emerald-500 text-black' : ''}`}>DASHBOARD</button>
        <button onClick={() => setActiveTab('inventory')} className={`p-4 rounded-xl font-bold text-left ${activeTab === 'inventory' ? 'bg-emerald-500 text-black' : ''}`}>WAREHOUSE</button>
        <button onClick={() => setActiveTab('logs')} className={`p-4 rounded-xl font-bold text-left ${activeTab === 'logs' ? 'bg-emerald-500 text-black' : ''}`}>FEED LOGS</button>
        <button onClick={() => setActiveTab('margins')} className={`p-4 rounded-xl font-bold text-left ${activeTab === 'margins' ? 'bg-emerald-500 text-black' : ''}`}>NET PROFIT</button>
        <button onClick={() => signOut(auth)} className="mt-auto p-4 text-red-500 font-bold uppercase text-xs flex items-center gap-2"><LogOut size={14}/> Sign Out</button>
      </nav>

      <main className="flex-1 p-8">
        {activeTab === 'logs' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-black italic uppercase">Feeding Logs</h2>
            <form onSubmit={logFeeding} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-black border border-emerald-900/30 p-6 rounded-2xl">
              <select name="groupId" className="bg-[#111] p-3 rounded-lg border border-emerald-900/20">
                <option value="">Select Pen</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <select name="feedId" className="bg-[#111] p-3 rounded-lg border border-emerald-900/20">
                <option value="">Select Feed</option>
                {inventory.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
              <input required name="amount" type="number" step="0.01" placeholder="Amount Fed" className="bg-[#111] p-3 rounded-lg border border-emerald-900/20" />
              <button className="bg-emerald-500 text-black font-black rounded-lg uppercase flex items-center justify-center gap-2"><Plus size={18}/> Log Feed</button>
            </form>
            
            <div className="space-y-2">
              {logs.map(log => {
                const g = groups.find(x => x.id === log.groupId);
                const i = inventory.find(x => x.id === log.feedId);
                return (
                  <div key={log.id} className="bg-black/50 border border-white/5 p-4 rounded-xl flex justify-between items-center">
                    <span className="text-sm font-bold uppercase">{g?.name} fed {log.amount} {i?.unit} of {i?.name}</span>
                    <button onClick={() => confirmDelete('logs', log.id)} className="text-red-900"><Trash2 size={16}/></button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Updated Margins Tab with Actual Logic */}
        {activeTab === 'margins' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-black italic uppercase">Net Profit Analysis</h2>
            {groups.map(g => {
              const actual = calculateMargin(g);
              return (
                <div key={g.id} className="bg-black border-2 border-emerald-900/30 p-6 rounded-2xl flex justify-between items-center">
                  <div>
                    <p className="text-2xl font-black uppercase italic leading-none">{g.name}</p>
                    <p className="text-xs font-bold text-white/40 mt-2 uppercase">Revenue: ${(g.headCount * g.dailyRevenue).toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black uppercase text-emerald-500">Actual Net Profit</p>
                    <p className={`text-3xl font-black italic ${actual < 0 ? 'text-red-500' : 'text-emerald-400'}`}>
                      ${actual.toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Inventory and Dashboard tabs remain with confirmDelete added to buttons */}
      </main>
    </div>
  );
}
