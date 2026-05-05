import React, { useState, useEffect, useMemo } from 'react';
import { 
  Home, Wheat, PawPrint, ClipboardList, TrendingUp, Plus, Trash2, 
  DollarSign, Scale, Calendar, AlertCircle, TrendingDown, User, Loader2,
  FileText, ArrowRight, Lock, Mail, LogOut, CheckCircle2, Download
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  onAuthStateChanged, signOut, updateProfile
} from 'firebase/auth';
import { 
  getFirestore, collection, doc, setDoc, addDoc, onSnapshot, deleteDoc 
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCDqBHlLIqXblDsyd_Kq4roZioCejJjG-4",
  authDomain: "agrifeed-pro.firebaseapp.com",
  projectId: "agrifeed-pro",
  storageBucket: "agrifeed-pro.firebasestorage.app",
  messagingSenderId: "705398190810",
  appId: "1:705398190810:web:764848553b8a083c62ebe3",
  measurementId: "G-44N1CXNP4D"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'agrifeed-pro-production-v1';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login'); 
  const [authError, setAuthError] = useState('');
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
    if (!user) {
      setInventory([]); setGroups([]); setLogs([]);
      return;
    }
    const userPath = ['artifacts', appId, 'users', user.uid];
    const unsubInv = onSnapshot(collection(db, ...userPath, 'inventory'), (s) => setInventory(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubGroups = onSnapshot(collection(db, ...userPath, 'groups'), (s) => setGroups(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubLogs = onSnapshot(collection(db, ...userPath, 'logs'), (s) => setLogs(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubInv(); unsubGroups(); unsubLogs(); };
  }, [user]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    const email = e.target.email.value;
    const password = e.target.password.value;
    const farmName = e.target.farmName?.value;
    try {
      if (authMode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (farmName) {
          await updateProfile(cred.user, { displayName: farmName });
          setUser({ ...cred.user, displayName: farmName });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setAuthError(err.message.replace('Firebase:', ''));
    }
  };

  const downloadCSV = () => {
    if (logs.length === 0) return;
    const headers = ["Date", "Population", "Feed", "Amount (LBS)", "Cost"];
    const rows = logs.map(l => {
      const g = groups.find(x => x.id === l.groupId) || { name: 'Unknown' };
      const f = inventory.find(x => x.id === l.feedId) || { name: 'Unknown', costPerUnit: 0 };
      return [l.date, g.name, f.name, l.amount, (l.amount * f.costPerUnit).toFixed(2)];
    });
    const content = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `AgriFeed_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-emerald-500 font-black italic">LOADING SYSTEM...</div>;

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
            {authError && <p className="text-red-500 text-xs font-bold uppercase">{authError}</p>}
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
        <h2 className="font-black text-xl italic uppercase text-emerald-500">AgriFeed Pro</h2>
        <div className="text-[10px] text-white/40 font-black uppercase">{user.displayName}</div>
        <button onClick={() => setActiveTab('dashboard')} className={`p-4 rounded-xl font-black text-left ${activeTab === 'dashboard' ? 'bg-emerald-500 text-black' : ''}`}>DASHBOARD</button>
        <button onClick={() => setActiveTab('inventory')} className={`p-4 rounded-xl font-black text-left ${activeTab === 'inventory' ? 'bg-emerald-500 text-black' : ''}`}>WAREHOUSE</button>
        <button onClick={() => setActiveTab('margins')} className={`p-4 rounded-xl font-black text-left ${activeTab === 'margins' ? 'bg-emerald-500 text-black' : ''}`}>NET PROFIT</button>
        <button onClick={() => signOut(auth)} className="mt-auto p-4 text-red-500 font-black text-xs uppercase">Sign Out</button>
      </nav>
      <main className="flex-1 p-12">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <h2 className="text-6xl font-black italic uppercase">{user.displayName || 'Operator'}</h2>
            <button onClick={downloadCSV} className="bg-white/5 border-2 border-white/10 p-5 rounded-2xl flex items-center gap-3 font-black text-xs uppercase">
              <Download className="w-5 h-5" /> Export Data
            </button>
          </div>
        )}
        {/* Placeholder for other views to keep code snippet concise for GH upload */}
        <p className="mt-8 text-white/20 italic uppercase font-black">System Live - Select Tab to Manage Data</p>
      </main>
    </div>
  );
}
