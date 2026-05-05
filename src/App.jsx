import React, { useState, useEffect } from 'react';
import { 
  Wheat, PawPrint, TrendingUp, Plus, Trash2, 
  DollarSign, Download, LogOut, Package
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
    return () => { unsubInv(); unsubGroups(); };
  }, [user]);

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
      unit: e.target.unit.value
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

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-emerald-500 font-bold italic">LOADING...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0f0d] flex items-center justify-center p-6 text-white">
        <div className="w-full max-w-md bg-black border-2 border-emerald-900/30 p-8 rounded-3xl shadow-2xl">
          <div className="text-center mb-8">
            <Wheat className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h1 className="text-3xl font-black italic uppercase italic">AgriFeed Pro</h1>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'signup' && <input required name="farmName" placeholder="Farm Name" className="w-full bg-[#111] border border-emerald-900/30 rounded-xl p-4" />}
            <input required name="email" type="email" placeholder="Email" className="w-full bg-[#111] border border-emerald-900/30 rounded-xl p-4" />
            <input required name="password" type="password" placeholder="Password" className="w-full bg-[#111] border border-emerald-900/30 rounded-xl p-4" />
            <button className="w-full bg-emerald-500 text-black font-black py-4 rounded-xl uppercase">{authMode === 'login' ? 'Login' : 'Sign Up'}</button>
          </form>
          <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="mt-4 text-emerald-400 text-xs font-bold uppercase w-full">Toggle Login/Signup</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#0a0f0d] text-white">
      <nav className="bg-black border-r border-emerald-900/30 w-full md:w-64 p-8 flex flex-col gap-4">
        <h2 className="font-black text-xl italic uppercase text-emerald-500">AgriFeed Pro</h2>
        <button onClick={() => setActiveTab('dashboard')} className={`p-4 rounded-xl font-bold text-left ${activeTab === 'dashboard' ? 'bg-emerald-500 text-black' : ''}`}>DASHBOARD</button>
        <button onClick={() => setActiveTab('inventory')} className={`p-4 rounded-xl font-bold text-left ${activeTab === 'inventory' ? 'bg-emerald-500 text-black' : ''}`}>WAREHOUSE</button>
        <button onClick={() => setActiveTab('margins')} className={`p-4 rounded-xl font-bold text-left ${activeTab === 'margins' ? 'bg-emerald-500 text-black' : ''}`}>NET PROFIT</button>
        <button onClick={() => signOut(auth)} className="mt-auto p-4 text-red-500 font-bold uppercase text-xs flex items-center gap-2"><LogOut size={14}/> Sign Out</button>
      </nav>

      <main className="flex-1 p-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <h1 className="text-5xl font-black italic uppercase tracking-tighter">{user.displayName}</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-black border border-emerald-900/30 p-6 rounded-2xl">
                <p className="text-emerald-500 text-xs font-black uppercase mb-1">Active Populations</p>
                <p className="text-3xl font-black italic">{groups.length}</p>
              </div>
              <div className="bg-black border border-emerald-900/30 p-6 rounded-2xl">
                <p className="text-emerald-500 text-xs font-black uppercase mb-1">Ingredients Stocked</p>
                <p className="text-3xl font-black italic">{inventory.length}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-black italic uppercase">Warehouse</h2>
            <form onSubmit={addItem} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-black border border-emerald-900/30 p-6 rounded-2xl">
              <input required name="name" placeholder="Ingredient (e.g. Corn)" className="bg-[#111] p-3 rounded-lg border border-emerald-900/20" />
              <input required name="cost" type="number" step="0.01" placeholder="Cost ($)" className="bg-[#111] p-3 rounded-lg border border-emerald-900/20" />
              <input required name="unit" placeholder="Unit (e.g. LBS)" className="bg-[#111] p-3 rounded-lg border border-emerald-900/20" />
              <button className="bg-emerald-500 text-black font-black rounded-lg uppercase">Add Stock</button>
            </form>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inventory.map(item => (
                <div key={item.id} className="bg-black border border-emerald-900/30 p-4 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="font-black uppercase italic">{item.name}</p>
                    <p className="text-xs text-emerald-500 font-bold">${item.costPerUnit} / {item.unit}</p>
                  </div>
                  <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'inventory', item.id))} className="text-red-900 hover:text-red-500"><Trash2 size={18}/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'margins' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-black italic uppercase">Net Profit</h2>
            <form onSubmit={addGroup} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-black border border-emerald-900/30 p-6 rounded-2xl">
              <input required name="name" placeholder="Pen/Group Name" className="bg-[#111] p-3 rounded-lg" />
              <input required name="count" type="number" placeholder="Head Count" className="bg-[#111] p-3 rounded-lg" />
              <input required name="rev" type="number" step="0.01" placeholder="Daily Rev/Head ($)" className="bg-[#111] p-3 rounded-lg" />
              <button className="bg-emerald-500 text-black font-black rounded-lg uppercase">Track Pen</button>
            </form>
            {groups.map(g => (
              <div key={g.id} className="bg-black border border-emerald-900/30 p-6 rounded-2xl flex justify-between items-center">
                <div>
                  <p className="text-xl font-black uppercase italic">{g.name}</p>
                  <p className="text-sm font-bold text-white/50">{g.headCount} Head • Total Potential: ${(g.headCount * g.dailyRevenue).toFixed(2)}/day</p>
                </div>
                <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'groups', g.id))} className="text-red-900"><Trash2 size={18}/></button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
