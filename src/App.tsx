import { useEffect, useMemo, useState } from 'react';
import {
  Activity, AudioLines, BarChart3, ChevronRight, CircleHelp, Crosshair,
  Gamepad2, Headphones, LayoutDashboard, LogIn, Menu, Music2, Settings,
  Shield, Sparkles, Swords, Target, Trophy, UserRound, X, Zap, Play,
  Pause, Search, SlidersHorizontal, Volume2, Crown, Timer, CheckCircle2,
  LockKeyhole, ArrowUpRight, RotateCcw
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from './supabase';

type Section = 'Overview' | 'Music' | 'Focus' | 'Games' | 'Fortnite' | 'Siege' | 'osu! Training' | 'Leaderboard' | 'Settings';
type Difficulty = 'Easy' | 'Normal' | 'Hard';

const navItems: { label: Section; icon: any; group: string }[] = [
  { label: 'Overview', icon: LayoutDashboard, group: 'Workspace' },
  { label: 'Music', icon: Headphones, group: 'Workspace' },
  { label: 'Focus', icon: Sparkles, group: 'Train' },
  { label: 'Games', icon: Gamepad2, group: 'Train' },
  { label: 'Fortnite', icon: Crosshair, group: 'Train' },
  { label: 'Siege', icon: Shield, group: 'Train' },
  { label: 'osu! Training', icon: AudioLines, group: 'Train' },
  { label: 'Leaderboard', icon: Trophy, group: 'Community' },
  { label: 'Settings', icon: Settings, group: 'Community' },
];

const musicGenres = ['All', 'Instrumental', 'Tryhard', 'Focus', 'Calm', 'Mind Music', 'Deep House', 'Electronic', 'Classical', 'Lo-fi', 'Cinematic'];
const trackSeeds = [
  ['Quiet Momentum','Instrumental'],['Neon Velocity','Tryhard'],['Clear Horizon','Focus'],['Soft Landing','Calm'],['Inner Space','Mind Music'],
  ['Midnight Circuit','Deep House'],['Pulse Driver','Electronic'],['Piano in Blue','Classical'],['Rainy Window','Lo-fi'],['Last Light','Cinematic']
];
const tracks = Array.from({length:100}, (_,i) => ({
  id:i+1, title: trackSeeds[i%trackSeeds.length][0] + (i>=10 ? ` ${Math.floor(i/10)+1}` : ''),
  genre: trackSeeds[i%trackSeeds.length][1], duration: `${2+Math.floor((i*7)%4)}:${String((i*13)%60).padStart(2,'0')}`,
  mood: ['Focused','Steady','Atmospheric','Energetic','Relaxed'][i%5]
}));

const games = [
  {name:'Snake', category:'Arcade', detail:'Classic arcade survival', icon:'↗', color:'green'},
  {name:'2048', category:'Puzzle', detail:'Merge numbers and plan ahead', icon:'▦', color:'orange'},
  {name:'Memory Match', category:'Memory', detail:'Train visual recall', icon:'◈', color:'purple'},
  {name:'Minesweeper', category:'Logic', detail:'Clear the board carefully', icon:'✳', color:'blue'},
  {name:'Tic-Tac-Toe', category:'Strategy', detail:'Think two moves ahead', icon:'×', color:'pink'},
  {name:'Reaction Test', category:'Reflex', detail:'Measure your response speed', icon:'◉', color:'yellow'},
  {name:'Number Memory', category:'Memory', detail:'Remember longer sequences', icon:'123', color:'blue'},
  {name:'Simon Says', category:'Memory', detail:'Repeat the growing pattern', icon:'●', color:'green'},
  {name:'Aim Trainer', category:'Aim', detail:'Hit targets quickly and accurately', icon:'⊙', color:'red'},
  {name:'Whack-a-Target', category:'Reflex', detail:'React to the next target', icon:'✦', color:'orange'},
  {name:'Pattern Recognition', category:'Focus', detail:'Find the rule in each sequence', icon:'⌘', color:'purple'},
];

const weapons = [
  {name:'R4-C', operator:'Ash', type:'Assault rifle', recoil:'High vertical; manageable horizontal drift'},
  {name:'F2', operator:'Twitch', type:'Assault rifle', recoil:'Strong vertical climb; short controlled bursts'},
  {name:'AK-12', operator:'Ace / Fuze', type:'Assault rifle', recoil:'Strong sustained climb; practice burst control'},
  {name:'C8-SFW', operator:'Buck', type:'Assault rifle', recoil:'Strong vertical recoil; burst discipline helps'},
  {name:'M762', operator:'Zofia', type:'Assault rifle', recoil:'Moderate-high climb; control with short bursts'},
  {name:'SMG-11', operator:'Smoke / Mute', type:'Machine pistol', recoil:'Very high; brief bursts are easier to manage'},
  {name:'416-C Carbine', operator:'Jäger', type:'Assault rifle', recoil:'Moderate vertical climb'},
  {name:'MP7', operator:'Bandit / Zero', type:'SMG', recoil:'Fast fire rate; keep bursts controlled'},
  {name:'Vector .45 ACP', operator:'Mira / Goyo', type:'SMG', recoil:'Very fast fire rate; sustained fire climbs quickly'},
  {name:'T-5 SMG', operator:'Lesion / Oryx', type:'SMG', recoil:'Manageable vertical climb'},
  {name:'Commando 9', operator:'Mozzie', type:'Assault rifle', recoil:'Generally steady with vertical climb'},
  {name:'P10 RONI', operator:'Mozzie / Aruni', type:'SMG', recoil:'Fast fire rate; prioritize short bursts'},
  {name:'MP5', operator:'Doc / Rook', type:'SMG', recoil:'Relatively steady vertical pattern'},
  {name:'SC3000K', operator:'Zero', type:'Assault rifle', recoil:'Moderate vertical climb'},
  {name:'G36C', operator:'Ash / Iana', type:'Assault rifle', recoil:'Moderate climb; consistent tracking helps'},
];

const rankNames = ['Unranked','Bronze I','Bronze II','Bronze III','Silver I','Silver II','Silver III','Gold I','Gold II','Gold III','Diamond I','Diamond II','Diamond III','Elite','Champion','Unreal'];
const rankForXp = (xp:number) => rankNames[Math.min(rankNames.length-1, Math.floor(Math.max(0,xp)/250))];

function App() {
  const [section, setSection] = useState<Section>('Overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('Normal');
  const [username, setUsername] = useState('Guest');
  const [displayName, setDisplayName] = useState('Guest Trainer');
  const [xp, setXp] = useState(0);
  const [userId, setUserId] = useState<string|null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin'|'signup'>('signup');
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [musicFilter, setMusicFilter] = useState('All');
  const [musicSearch, setMusicSearch] = useState('');
  const [playing, setPlaying] = useState<number|null>(null);
  const [volume, setVolume] = useState(65);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [toast, setToast] = useState('');
  const [settings, setSettings] = useState({theme:'Dark', graphics:'High', fps:'60', animations:true, particles:true, crosshair:'#7c8cff', crosshairSize:18, sensitivity:6.5, binds:{forward:'W', left:'A', back:'S', right:'D', shoot:'Mouse 1'}});
  const [sessionCount, setSessionCount] = useState(0);
  const [targetHits, setTargetHits] = useState(0);
  const [aimActive, setAimActive] = useState(false);
  const [aimTarget, setAimTarget] = useState({x:50,y:50});
  const [aimStarted, setAimStarted] = useState(0);
  const [aimTimes, setAimTimes] = useState<number[]>([]);
  const [reactionState, setReactionState] = useState<'idle'|'waiting'|'ready'|'done'>('idle');
  const [reactionStart, setReactionStart] = useState(0);
  const [reactionMs, setReactionMs] = useState<number|null>(null);
  const [activeGame, setActiveGame] = useState('');
  const [snakeScore, setSnakeScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState<{username:string;xp:number;rank:string}[]>([]);
  const [adminTab, setAdminTab] = useState('Content');

  useEffect(() => {
    const local = localStorage.getItem('ss-training-settings');
    if (local) { try { setSettings(s=>({...s,...JSON.parse(local)})); } catch {} }
    const fav = localStorage.getItem('ss-training-favorites');
    if (fav) { try { setFavorites(JSON.parse(fav)); } catch {} }
    const guestXp = Number(localStorage.getItem('ss-training-guest-xp')||0);
    setXp(guestXp);
    setLeaderboard([
      {username:'AimNova',xp:4820,rank:rankForXp(4820)},
      {username:'PixelGhost',xp:4260,rank:rankForXp(4260)},
      {username:'Vanta',xp:3940,rank:rankForXp(3940)},
      {username:'EchoShot',xp:3510,rank:rankForXp(3510)},
      {username:'Kairo',xp:3270,rank:rankForXp(3270)},
      {username:'Zenith',xp:2890,rank:rankForXp(2890)},
      {username:'MiraX',xp:2520,rank:rankForXp(2520)},
      {username:'NovaAim',xp:2210,rank:rankForXp(2210)},
      {username:'Drift',xp:1840,rank:rankForXp(1840)},
      {username:'SSZN',xp:guestXp,rank:rankForXp(guestXp)}
    ]);
    if (supabase) {
      supabase.auth.getSession().then(async ({data}) => {
        const user = data.session?.user;
        if (user) {
          setUserId(user.id);
          setUsername(user.user_metadata?.username || user.email?.split('@')[0] || 'Player');
          setDisplayName(user.user_metadata?.display_name || user.user_metadata?.username || 'Player');
          await loadProfile(user.id);
        }
      });
      const {data:listener} = supabase.auth.onAuthStateChange((_event, session) => {
        if (!session?.user) { setUserId(null); setIsAdmin(false); }
      });
      return () => listener.subscription.unsubscribe();
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('ss-training-settings', JSON.stringify(settings));
    document.documentElement.dataset.theme = settings.theme.toLowerCase();
    document.documentElement.dataset.motion = settings.animations ? 'full' : 'reduced';
  }, [settings]);

  useEffect(() => { localStorage.setItem('ss-training-favorites',JSON.stringify(favorites)); },[favorites]);
  useEffect(() => {
    if (!userId) localStorage.setItem('ss-training-guest-xp',String(xp));
  },[xp,userId]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(()=>setToast(''),2800);
    return ()=>window.clearTimeout(timer);
  },[toast]);

  async function loadProfile(id:string) {
    if (!supabase) return;
    const {data:profile} = await supabase.from('profiles').select('*').eq('id',id).maybeSingle();
    if (profile) {
      setXp(profile.xp || 0); setUsername(profile.username); setDisplayName(profile.display_name || profile.username);
      setIsAdmin(profile.role === 'admin');
    }
  }

  async function awardXp(base:number, reason:string) {
    const multiplier = difficulty==='Easy' ? 1 : difficulty==='Normal' ? 1.5 : 2;
    const amount = Math.max(1,Math.round(base*multiplier));
    if (userId && supabase) {
      const {data,error} = await supabase.rpc('award_training_xp',{p_amount:amount,p_reason:reason});
      if (!error && typeof data === 'number') setXp(data);
      else setToast('XP could not sync. Check the database setup.');
    } else {
      setXp(prev=>prev+amount);
      setToast(`+${amount} XP · ${reason}`);
    }
    setSessionCount(n=>n+1);
  }

  async function signUp(e:React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setAuthError(''); setAuthBusy(true);
    const fd = new FormData(e.currentTarget);
    const name=String(fd.get('displayName')||'').trim();
    const uname=String(fd.get('username')||'').trim();
    const password=String(fd.get('password')||'');
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(uname)) { setAuthError('Username must be 3–20 characters using letters, numbers, or underscores.'); setAuthBusy(false); return; }
    if (password.length<10) { setAuthError('Use a password with at least 10 characters.'); setAuthBusy(false); return; }
    if (!supabase) { setAuthError('Connect Supabase first using the setup guide. Demo mode works without an account.'); setAuthBusy(false); return; }
    const email = `${uname.toLowerCase()}@accounts.sstraining.invalid`;
    const {data,error} = await supabase.auth.signUp({email,password,options:{data:{username:uname,display_name:name||uname}}});
    if (error) setAuthError(error.message);
    else {
      setUsername(uname); setDisplayName(name||uname);
      if (data.user) { setUserId(data.user.id); await loadProfile(data.user.id); }
      setAuthOpen(false); setToast('Account created. Check whether email confirmation is enabled.');
    }
    setAuthBusy(false);
  }

  async function signIn(e:React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setAuthError(''); setAuthBusy(true);
    const fd=new FormData(e.currentTarget);
    const uname=String(fd.get('username')||'').trim();
    const password=String(fd.get('password')||'');
    if (!supabase) { setAuthError('Connect Supabase first using the setup guide. Demo mode works without an account.'); setAuthBusy(false); return; }
    const {data:lookup,error:lookupError}=await supabase.rpc('email_for_username',{p_username:uname});
    if (lookupError || !lookup) { setAuthError('Could not find that username. Check it or create an account.'); setAuthBusy(false); return; }
    const {data,error}=await supabase.auth.signInWithPassword({email:lookup,password});
    if (error) setAuthError(error.message);
    else if (data.user) {
      setUserId(data.user.id); setUsername(data.user.user_metadata?.username||uname);
      setDisplayName(data.user.user_metadata?.display_name||uname); await loadProfile(data.user.id);
      setAuthOpen(false); setToast('Welcome back.');
    }
    setAuthBusy(false);
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    setUserId(null); setIsAdmin(false); setUsername('Guest'); setDisplayName('Guest Trainer');
    setToast('Signed out.');
  }

  function startReaction() {
    setReactionMs(null); setReactionState('waiting');
    const delay=1200+Math.random()*2600;
    window.setTimeout(()=>{setReactionState(s=>s==='waiting'?'ready':s);setReactionStart(performance.now());},delay);
  }
  function reactionClick() {
    if (reactionState==='waiting') { setReactionState('idle'); setToast('Too early — wait for the signal.'); }
    else if (reactionState==='ready') {
      const ms=Math.round(performance.now()-reactionStart); setReactionMs(ms); setReactionState('done');
      setTimeout(()=>awardXp(ms<300?8:4,'Reaction test'),100);
    }
  }

  function startAim() {
    setAimActive(true); setTargetHits(0); setAimTimes([]); setAimStarted(performance.now());
    setAimTarget({x:12+Math.random()*76,y:16+Math.random()*68});
  }
  function hitAim() {
    if (!aimActive) return;
    const elapsed=performance.now()-aimStarted;
    setAimTimes(t=>[...t,elapsed]); setTargetHits(h=>h+1);
    if (targetHits+1>=10) {
      setAimActive(false); awardXp(10,'Aim training'); setToast('Drill complete · 10 targets cleared.');
    } else setAimTarget({x:10+Math.random()*80,y:14+Math.random()*70});
  }

  const filteredTracks=useMemo(()=>tracks.filter(t=>(musicFilter==='All'||t.genre===musicFilter)&&t.title.toLowerCase().includes(musicSearch.toLowerCase())),[musicFilter,musicSearch]);
  const nextRank=rankNames[Math.min(rankNames.length-1,Math.floor(xp/250)+1)];
  const rankProgress=(xp%250)/250*100;
  const rank=rankForXp(xp);

  const setPage=(p:Section)=>{setSection(p);setSidebarOpen(false);setActiveGame('');window.scrollTo({top:0,behavior:'smooth'});};
  const Header=({title,subtitle}:{title:string;subtitle:string})=><div className="page-heading"><div><div className="eyebrow">SS TRAINING / {title.toUpperCase()}</div><h1>{title}</h1><p>{subtitle}</p></div><div className="heading-actions"><span className="live-pill"><i/> Training ready</span><button className="icon-button" title="Settings" onClick={()=>setPage('Settings')}><Settings size={17}/></button></div></div>;
  const DiffPicker=()=><div className="difficulty-picker">{(['Easy','Normal','Hard'] as Difficulty[]).map(d=><button key={d} onClick={()=>setDifficulty(d)} className={difficulty===d?'selected':''}>{d}</button>)}</div>;

  return <div className="app-shell">
    <aside className={`sidebar ${sidebarOpen?'sidebar-open':''}`}>
      <div className="brand-row"><div className="brand-mark">SS</div><div className="brand-text"><strong>SS Training</strong><span>PERFORMANCE STUDIO</span></div><button className="mobile-close icon-button" onClick={()=>setSidebarOpen(false)}><X size={18}/></button></div>
      <div className="sidebar-profile"><div className="avatar">{(username==='Guest'?'G':username.slice(0,2)).toUpperCase()}</div><div className="profile-copy"><strong>{username}</strong><span>{rank}</span></div><button className="tiny-chevron" onClick={()=>setAuthOpen(true)}><ChevronRight size={15}/></button></div>
      {['Workspace','Train','Community'].map(group=><div className="nav-group" key={group}><div className="nav-label">{group}</div>{navItems.filter(n=>n.group===group).map(item=><button key={item.label} className={`nav-item ${section===item.label?'active':''}`} onClick={()=>setPage(item.label)}><item.icon size={17} strokeWidth={1.8}/><span>{item.label}</span>{item.label==='Leaderboard'&&<span className="nav-badge">10</span>}</button>)}</div>)}
      <div className="sidebar-bottom"><div className="sidebar-tip"><Sparkles size={15}/><span>Small reps.<br/><b>Big progress.</b></span></div><button className="user-row" onClick={()=>userId?signOut():setAuthOpen(true)}><div className="user-avatar"><UserRound size={16}/></div><div><strong>{userId?displayName:'Sign in / create account'}</strong><span>{userId?'Account connected':'Save your progress'}</span></div><ChevronRight size={15}/></button></div>
    </aside>
    {sidebarOpen&&<button className="mobile-scrim" onClick={()=>setSidebarOpen(false)} aria-label="Close navigation"/>}
    <main className="main-content">
      <header className="topbar"><button className="icon-button mobile-menu" onClick={()=>setSidebarOpen(true)}><Menu size={19}/></button><div className="breadcrumb"><span>Workspace</span><ChevronRight size={14}/><strong>{section}</strong></div><div className="topbar-right"><div className="xp-chip"><Zap size={14} fill="currentColor"/><b>{xp.toLocaleString()}</b><span>XP</span></div><button className="primary-button small" onClick={()=>setAuthOpen(true)}>{userId?'Account':'Get started'} <ArrowUpRight size={14}/></button></div></header>

      {section==='Overview'&&<div className="page-wrap">
        <div className="hero-panel"><div className="hero-orb orb-one"/><div className="hero-orb orb-two"/><div className="hero-content"><div className="hero-kicker"><span className="kicker-dot"/> YOUR PERSONAL TRAINING SPACE</div><h1>Make every<br/><span>session count.</span></h1><p>Build consistency. Sharpen your aim. Find your flow.<br/>Your next level starts with one focused session.</p><div className="hero-buttons"><button className="primary-button" onClick={()=>setPage('Fortnite')}>Start training <ChevronRight size={16}/></button><button className="secondary-button" onClick={()=>setPage('Music')}><Play size={14}/> Find your focus</button></div><div className="hero-footnote"><span><CheckCircle2 size={14}/> Built for your pace</span><span><Activity size={14}/> {sessionCount} sessions this visit</span></div></div><div className="hero-graphic"><div className="radar-ring ring-a"/><div className="radar-ring ring-b"/><div className="radar-ring ring-c"/><div className="radar-crosshair"><Crosshair size={48} strokeWidth={1}/></div><div className="radar-point point-a"/><div className="radar-point point-b"/><div className="radar-point point-c"/><div className="radar-label label-a">PRECISION <b>98.4%</b></div><div className="radar-label label-b">REACTION <b>214 ms</b></div></div></div>
        <div className="stat-grid"><div className="stat-card"><div className="stat-top"><span>Total experience</span><div className="stat-icon purple"><Zap size={17}/></div></div><strong>{xp.toLocaleString()} <small>XP</small></strong><div className="stat-bottom"><div className="progress-track"><i style={{width:`${rankProgress}%`}}/></div><span>{Math.round(rankProgress)}% to next rank</span></div></div><div className="stat-card"><div className="stat-top"><span>Current rank</span><div className="stat-icon blue"><Trophy size={17}/></div></div><strong className="rank-value">{rank}</strong><div className="stat-bottom"><span className="muted">Next up: {nextRank}</span><span className="rank-arrow">↗</span></div></div><div className="stat-card"><div className="stat-top"><span>Sessions this visit</span><div className="stat-icon green"><Activity size={17}/></div></div><strong>{sessionCount.toString().padStart(2,'0')}</strong><div className="stat-bottom"><span className="muted">Every rep adds up</span><span className="trend">+ keep going</span></div></div><div className="stat-card"><div className="stat-top"><span>Targets cleared</span><div className="stat-icon orange"><Target size={17}/></div></div><strong>{targetHits.toString().padStart(2,'0')}</strong><div className="stat-bottom"><span className="muted">Aim trainer</span><button className="text-button" onClick={()=>setPage('Fortnite')}>Practice <ChevronRight size={13}/></button></div></div></div>
        <div className="section-title-row"><div><h2>Choose your session</h2><p>Pick a lane and get into the flow.</p></div><button className="text-button" onClick={()=>setPage('Focus')}>Explore all <ChevronRight size={14}/></button></div>
        <div className="feature-grid">{[
          {title:'Aim & precision',sub:'Fortnite training',icon:Crosshair,tone:'violet',tag:'REACTION + ACCURACY',page:'Fortnite' as Section},
          {title:'Music for focus',sub:'Curated listening',icon:Headphones,tone:'blue',tag:'100 TRACK LIBRARY',page:'Music' as Section},
          {title:'Quick challenges',sub:'Focus and reflex',icon:Sparkles,tone:'orange',tag:'MIND + SPEED',page:'Focus' as Section},
          {title:'Arcade corner',sub:'11 mini-games',icon:Gamepad2,tone:'green',tag:'PLAY + EARN XP',page:'Games' as Section}
        ].map(f=><button className={`feature-card ${f.tone}`} key={f.title} onClick={()=>setPage(f.page)}><div className="feature-icon"><f.icon size={21}/></div><div className="feature-tag">{f.tag}</div><h3>{f.title}</h3><p>{f.sub}</p><div className="feature-arrow"><ArrowUpRight size={17}/></div></button>)}</div>
        <div className="lower-grid"><div className="panel leaderboard-panel"><div className="panel-heading"><div><h3>Top trainers</h3><p>Leaderboard preview</p></div><button className="icon-button" onClick={()=>setPage('Leaderboard')}><ArrowUpRight size={16}/></button></div>{leaderboard.slice(0,5).map((p,i)=><div className="leader-row" key={p.username}><span className={`leader-place place-${i+1}`}>{String(i+1).padStart(2,'0')}</span><div className="leader-avatar">{p.username.slice(0,2).toUpperCase()}</div><div className="leader-name"><b>{p.username}</b><span>{p.rank}</span></div><div className="leader-xp">{p.xp.toLocaleString()} <small>XP</small></div></div>)}<button className="panel-footer-button" onClick={()=>setPage('Leaderboard')}>View leaderboard <ChevronRight size={14}/></button></div>
        <div className="panel daily-panel"><div className="panel-heading"><div><h3>Daily challenge</h3><p>A small goal for today</p></div><div className="daily-icon"><Sparkles size={17}/></div></div><div className="daily-banner"><div><span>CHALLENGE 01</span><h4>Find your rhythm</h4><p>Complete a reaction test and an aim drill.</p></div><div className="daily-symbol">✳</div></div><div className="daily-progress-label"><span>Today's progress</span><b>{Math.min(sessionCount,2)}/2</b></div><div className="progress-track"><i style={{width:`${Math.min(sessionCount/2*100,100)}%`}}/></div><button className="primary-button full" onClick={()=>setPage('Focus')}>Start challenge <ChevronRight size={15}/></button></div></div>
      </div>}

      {section==='Music'&&<div className="page-wrap"><Header title="Music" subtitle="A soundtrack for every kind of session."/><div className="music-hero"><div className="music-hero-art"><div className="vinyl"><div/></div><AudioLines size={22} className="music-art-icon"/></div><div className="music-hero-copy"><span className="eyebrow">SS CURATED · VOL. 01</span><h2>Find your frequency.</h2><p>Instrumentals, deep focus, calm soundscapes, and high-energy sessions.</p><div className="music-hero-meta"><span><Music2 size={14}/> 100 track entries</span><span><Headphones size={14}/> 10 moods</span></div></div><div className="music-hero-action"><button className="primary-button" onClick={()=>{setMusicFilter('All');setPlaying(1);setToast('Track selected. Add licensed audio sources to enable playback.')}}><Play size={15} fill="currentColor"/> Explore library</button></div></div>
        <div className="music-toolbar"><div className="search-field"><Search size={16}/><input placeholder="Search tracks or moods..." value={musicSearch} onChange={e=>setMusicSearch(e.target.value)}/><kbd>⌘ K</kbd></div><button className="secondary-button compact"><SlidersHorizontal size={15}/> Filter</button></div><div className="genre-tabs">{musicGenres.map(g=><button key={g} className={musicFilter===g?'selected':''} onClick={()=>setMusicFilter(g)}>{g}</button>)}</div>
        <div className="track-list"><div className="track-list-header"><span># / TRACK</span><span>GENRE</span><span>MOOD</span><span>LENGTH</span><span/></div>{filteredTracks.slice(0,50).map((t,i)=><div className={`track-row ${playing===t.id?'is-playing':''}`} key={t.id}><button className="track-play" onClick={()=>{setPlaying(playing===t.id?null:t.id);setToast('Audio source not connected yet. The track library is ready for licensed audio URLs.')}}>{playing===t.id?<Pause size={15}/>:<Play size={15} fill="currentColor"/>}</button><div className="track-main"><div className={`album-tile tile-${i%6}`}><AudioLines size={17}/></div><div><b>{t.title}</b><span>SS Training Selection</span></div></div><span className="track-genre">{t.genre}</span><span className="track-mood">{t.mood}</span><span className="track-length">{t.duration}</span><button className={`favorite-button ${favorites.includes(t.id)?'favorited':''}`} onClick={()=>setFavorites(f=>f.includes(t.id)?f.filter(id=>id!==t.id):[...f,t.id])}>{favorites.includes(t.id)?'♥':'♡'}</button></div>)}{filteredTracks.length===0&&<div className="empty-state">No tracks match that search.</div>}</div>
        <div className="music-player"><div className="player-track"><div className="album-tile tile-2"><AudioLines size={17}/></div><div><b>{playing?tracks.find(t=>t.id===playing)?.title:'Choose a track'}</b><span>{playing?'SS Training Selection':'Your session soundtrack'}</span></div></div><div className="player-controls"><button className="plain-icon" onClick={()=>setPlaying(playing?Math.max(1,playing-1):1)}><RotateCcw size={15}/></button><button className="player-play" onClick={()=>setPlaying(playing?null:1)}>{playing?<Pause size={16}/>:<Play size={16} fill="currentColor"/>}</button><button className="plain-icon" onClick={()=>setPlaying(playing?Math.min(100,playing+1):1)}><ChevronRight size={17}/></button><div className="fake-wave"><i/></div></div><div className="player-volume"><Volume2 size={16}/><input type="range" min="0" max="100" value={volume} onChange={e=>setVolume(Number(e.target.value))}/></div></div>
      </div>}

      {section==='Focus'&&<div className="page-wrap"><Header title="Focus" subtitle="Train your attention, reaction, and consistency."/><div className="training-toolbar"><div><span className="eyebrow">SESSION DIFFICULTY</span><DiffPicker/></div><div className="mode-note"><Sparkles size={17}/><span>Choose a drill. Track your progress. Repeat.</span></div></div><div className="focus-grid"><div className="focus-card focus-main"><div className="focus-card-top"><div className="large-icon violet"><Timer size={22}/></div><span className="pill">REACTION</span></div><h3>Reaction time</h3><p>Wait for the signal, then respond as quickly as you can. Don't jump the gun.</p><div className={`reaction-stage state-${reactionState}`} onClick={reactionClick}><div className="reaction-center">{reactionState==='idle'?<><Crosshair size={28}/><b>Ready when you are</b><span>Start the test below</span></>:reactionState==='waiting'?<><div className="waiting-dots">···</div><b>Stay focused</b><span>Wait for the signal</span></>:reactionState==='ready'?<><div className="reaction-go">GO</div><b>CLICK NOW</b></>:<><CheckCircle2 size={27}/><b>{reactionMs} ms</b><span>{reactionMs!<250?'Excellent reaction':reactionMs!<350?'Good response':'Keep practicing'}</span></>}</div></div><button className="primary-button full" onClick={e=>{e.stopPropagation();if(reactionState==='ready')reactionClick();else startReaction()}}>{reactionState==='waiting'?'Wait for signal':reactionState==='ready'?'React now':reactionState==='done'?'Try again':'Start reaction test'} <ChevronRight size={15}/></button></div>
        <div className="focus-card"><div className="focus-card-top"><div className="large-icon blue"><Target size={22}/></div><span className="pill">ACCURACY</span></div><h3>Precision drill</h3><p>Switch your attention between targets and practice deliberate, accurate responses.</p><div className="precision-visual"><div className="precision-ring ring1"/><div className="precision-ring ring2"/><div className="precision-ring ring3"/><Crosshair size={28}/></div><button className="secondary-button full" onClick={()=>setPage('Fortnite')}>Open aim trainer <ChevronRight size={15}/></button></div>
        <div className="focus-card"><div className="focus-card-top"><div className="large-icon orange"><AudioLines size={22}/></div><span className="pill">RHYTHM</span></div><h3>Rhythm & timing</h3><p>Practice timing, pattern recognition, and consistency in a simple rhythm exercise.</p><div className="rhythm-visual">{[1,3,2,5,3,4,2,6,3,5,2,4].map((n,i)=><i key={i} style={{height:`${n*7}px`,animationDelay:`${i*70}ms`}}/>)}</div><button className="secondary-button full" onClick={()=>setPage('osu! Training')}>Open rhythm trainer <ChevronRight size={15}/></button></div></div>
      </div>}

      {section==='Games'&&<div className="page-wrap"><Header title="Games" subtitle="Quick games for sharper thinking and faster reactions."/><div className="games-intro"><div><span className="eyebrow">THE ARCADE</span><h2>Play a little.<br/>Improve a lot.</h2><p>Lightweight browser games for your breaks between sessions.</p></div><div className="arcade-orb">✳</div></div>{activeGame?<div className="panel game-active"><div className="panel-heading"><div><h3>{activeGame}</h3><p>Mini-game · browser session</p></div><button className="secondary-button compact" onClick={()=>setActiveGame('')}>← All games</button></div>{activeGame==='Reaction Test'?<div className={`reaction-stage state-${reactionState}`} onClick={reactionClick}><div className="reaction-center"><b>{reactionState==='ready'?'CLICK!':reactionState==='done'?`${reactionMs} ms`:'Tap start and wait for green'}</b></div></div>:activeGame==='Snake'?<SnakeGame onScore={s=>setSnakeScore(s)} onFinish={s=>{setSnakeScore(s);awardXp(Math.min(15,Math.max(1,s)),'Snake game');}}/>:<div className="generic-game"><div className="generic-game-symbol">{activeGame==='2048'?'2048':activeGame==='Tic-Tac-Toe'?'× ○':activeGame==='Memory Match'?'◈':activeGame==='Number Memory'?'123':'✦'}</div><p>This mini-game slot is ready to be implemented as an independent module.</p><button className="primary-button" onClick={()=>awardXp(2,`${activeGame} practice`)}>Complete practice round <CheckCircle2 size={15}/></button></div>}</div>:<div className="game-grid">{games.map((g,i)=><button className="game-card" key={g.name} onClick={()=>{setActiveGame(g.name);if(g.name==='Reaction Test')setReactionState('idle')}}><div className={`game-art ${g.color}`}><span>{g.icon}</span><small>0{i+1}</small></div><div className="game-card-copy"><span className="eyebrow">{g.category}</span><h3>{g.name}</h3><p>{g.detail}</p><div className="game-card-footer"><span>Play now</span><ArrowUpRight size={15}/></div></div></button>)}</div>}</div>}

      {section==='Fortnite'&&<div className="page-wrap"><Header title="Fortnite Training" subtitle="Build reliable aim, clean crosshair placement, and faster target acquisition."/><div className="training-toolbar"><div><span className="eyebrow">DIFFICULTY</span><DiffPicker/></div><div className="mode-note"><Crosshair size={17}/><span>Browser-based drills · Customize your setup</span></div></div><div className="training-layout"><div className="panel aim-panel"><div className="panel-heading"><div><h3>Aim trainer</h3><p>Hit 10 targets. Keep your movement intentional.</p></div><span className="pill">10 TARGETS</span></div><div className={`aim-canvas ${aimActive?'aim-live':''}`} onClick={e=>{if(aimActive && e.target===e.currentTarget){}}}>{aimActive?<><button className="aim-target" style={{left:`${aimTarget.x}%`,top:`${aimTarget.y}%`,borderColor:settings.crosshair}} onClick={e=>{e.stopPropagation();hitAim()}}><span/></button><div className="aim-hud"><span>TARGETS <b>{targetHits}/10</b></span><span>SESSION <b>ACTIVE</b></span></div></>:<div className="aim-start-overlay"><div className="aim-start-icon"><Crosshair size={32}/></div><h3>Lock in.</h3><p>Clear 10 targets as accurately as possible.</p><button className="primary-button" onClick={startAim}>Start aim drill <Play size={14} fill="currentColor"/></button></div>}<div className="canvas-crosshair" style={{'--crosshair':settings.crosshair,'--crosshair-size':`${settings.crosshairSize}px`} as React.CSSProperties}/></div><div className="aim-stats"><div><span>Targets hit</span><b>{targetHits}<small> / 10</small></b></div><div><span>Average time</span><b>{aimTimes.length?`${Math.round(aimTimes.reduce((a,b)=>a+b,0)/aimTimes.length/aimTimes.length)} ms`:'—'}</b></div><div><span>Accuracy</span><b>{targetHits?`${Math.round(targetHits/(targetHits+Math.max(0,Math.round(targetHits*.15)))*100)}%`:'—'}</b></div></div></div>
        <div className="panel settings-panel"><div className="panel-heading"><div><h3>Training setup</h3><p>Make it feel right.</p></div><Settings size={17}/></div><div className="setting-row"><div><b>Mouse sensitivity</b><span>Training-only value</span></div><strong>{settings.sensitivity.toFixed(1)}</strong></div><input className="range-input" type="range" min="1" max="20" step=".1" value={settings.sensitivity} onChange={e=>setSettings(s=>({...s,sensitivity:Number(e.target.value)}))}/><div className="setting-row"><div><b>Crosshair color</b><span>Pick a clear contrast</span></div><input type="color" value={settings.crosshair} onChange={e=>setSettings(s=>({...s,crosshair:e.target.value}))}/></div><div className="setting-row"><div><b>Crosshair size</b><span>Preview updates live</span></div><strong>{settings.crosshairSize}px</strong></div><input className="range-input" type="range" min="8" max="36" value={settings.crosshairSize} onChange={e=>setSettings(s=>({...s,crosshairSize:Number(e.target.value)}))}/><div className="crosshair-preview"><div style={{'--crosshair':settings.crosshair,'--crosshair-size':`${settings.crosshairSize}px`} as React.CSSProperties}/><span>Crosshair preview</span></div><button className="secondary-button full" onClick={()=>setPage('Settings')}>More settings <ChevronRight size={15}/></button></div></div><div className="panel keybind-panel"><div className="panel-heading"><div><h3>Keybinds</h3><p>Set your training controls</p></div><span className="pill">CUSTOM</span></div><div className="keybind-grid">{Object.entries(settings.binds).map(([key,value])=><label className="keybind" key={key}><span>{key==='forward'?'Move forward':key==='left'?'Move left':key==='back'?'Move backward':key==='right'?'Move right':'Fire'}</span><input value={value} onChange={e=>setSettings(s=>({...s,binds:{...s.binds,[key]:e.target.value}}))}/></label>)}</div><p className="fine-print">These bindings are for SS Training's browser exercises. They do not change Fortnite's in-game settings.</p></div></div>
      </div>}

      {section==='Siege'&&<div className="page-wrap"><Header title="Siege Training" subtitle="Practice head-level placement, peek timing, and recoil awareness."/><div className="training-toolbar"><div><span className="eyebrow">DIFFICULTY</span><DiffPicker/></div><div className="mode-note"><Shield size={17}/><span>Training simulations · Not connected to the game</span></div></div><div className="siege-hero"><div><span className="eyebrow">PRECISION LAB / 01</span><h2>Win the angle.<br/><span>Own the moment.</span></h2><p>Build consistent habits through focused, repeatable drills.</p></div><div className="siege-reticle"><Crosshair size={66} strokeWidth={.8}/></div></div><div className="siege-drill-grid">{[{name:'Headshot placement',desc:'Keep your aim at head height as targets appear.',icon:Target,reward:8},{name:'Quick-peek timing',desc:'Practice short exposure windows and quick target reacquisition.',icon:Zap,reward:6},{name:'Recoil awareness',desc:'Study recoil profiles and practice controlled bursts.',icon:Activity,reward:7}].map(d=><div className="panel drill-card" key={d.name}><div className="large-icon violet"><d.icon size={21}/></div><span className="pill">+{d.reward} XP BASE</span><h3>{d.name}</h3><p>{d.desc}</p><button className="secondary-button full" onClick={()=>{if(d.name==='Headshot placement'){setPage('Fortnite');startAim();setToast('Aim drill started. This is a shared browser training mode.')}else awardXp(2,`${d.name} practice`)}}>Start drill <ChevronRight size={15}/></button></div>)}</div><div className="panel weapon-panel"><div className="panel-heading"><div><h3>Weapon reference</h3><p>15 popular weapons · Training notes, not exact live telemetry</p></div><span className="pill">REFERENCE</span></div><div className="weapon-table"><div className="weapon-head"><span>WEAPON</span><span>OPERATOR</span><span>TYPE</span><span>RECOIL NOTES</span></div>{weapons.map((w,i)=><div className="weapon-row" key={w.name}><span><i>{String(i+1).padStart(2,'0')}</i><b>{w.name}</b></span><span>{w.operator}</span><span>{w.type}</span><span>{w.recoil}</span></div>)}</div><p className="fine-print">Recoil can change between game updates and platform settings. Verify current values in-game; these notes are broad practice guidance.</p></div></div>}

      {section==='osu! Training'&&<div className="page-wrap"><Header title="osu! Training" subtitle="Timing, rhythm, and precision — practice one beat at a time."/><div className="training-toolbar"><div><span className="eyebrow">DIFFICULTY</span><DiffPicker/></div><div className="mode-note"><AudioLines size={17}/><span>Original rhythm drill inspired by timing games</span></div></div><RhythmTrainer onComplete={n=>awardXp(n,'Rhythm training')}/></div>}

      {section==='Leaderboard'&&<div className="page-wrap"><Header title="Leaderboard" subtitle="A snapshot of trainers putting in the work."/><div className="leaderboard-hero"><div><span className="eyebrow">SEASON 01 · ALL MODES</span><h2>Consistency<br/>gets noticed.</h2><p>Earn XP, sharpen your skills, and climb the ranks.</p></div><div className="leaderboard-trophy"><Trophy size={54}/></div></div><div className="panel full-leaderboard"><div className="panel-heading"><div><h3>Top 10 trainers</h3><p>XP totals shown for this leaderboard view</p></div><span className="pill">TOP 10</span></div>{[...leaderboard.filter(p=>p.username!=='SSZN'),{username, xp, rank}].sort((a,b)=>b.xp-a.xp).slice(0,10).map((p,i)=><div className={`leader-row full-row ${p.username===username?'current-user':''}`} key={`${p.username}-${i}`}><span className={`leader-place place-${i+1}`}>{String(i+1).padStart(2,'0')}</span><div className="leader-avatar">{p.username.slice(0,2).toUpperCase()}</div><div className="leader-name"><b>{p.username} {p.username===username&&<span className="you-tag">YOU</span>}</b><span>{p.rank}</span></div><div className="leader-xp">{p.xp.toLocaleString()} <small>XP</small></div></div>)}</div><p className="fine-print">Demo leaderboard entries are illustrative. A real shared leaderboard requires connected Supabase tables and server-side XP validation.</p></div>}

      {section==='Settings'&&<div className="page-wrap"><Header title="Settings" subtitle="Make SS Training feel like your own space."/><div className="settings-layout"><div className="panel settings-section"><div className="panel-heading"><div><h3>Appearance</h3><p>Fine-tune your workspace.</p></div><Sparkles size={17}/></div><div className="settings-control"><div><b>Theme</b><span>Choose your preferred look</span></div><div className="segmented">{['Dark','Light','System'].map(t=><button className={settings.theme===t?'selected':''} key={t} onClick={()=>setSettings(s=>({...s,theme:t}))}>{t}</button>)}</div></div><div className="settings-control"><div><b>Graphics quality</b><span>Visual effects and rendering</span></div><select value={settings.graphics} onChange={e=>setSettings(s=>({...s,graphics:e.target.value}))}><option>Low</option><option>Medium</option><option>High</option></select></div><div className="settings-control"><div><b>FPS target</b><span>Browser rendering target, not guaranteed</span></div><select value={settings.fps} onChange={e=>setSettings(s=>({...s,fps:e.target.value}))}><option>30</option><option>60</option><option>120</option><option>Unlimited</option></select></div><div className="settings-control"><div><b>Animations</b><span>Interface motion and transitions</span></div><button className={`toggle ${settings.animations?'on':''}`} onClick={()=>setSettings(s=>({...s,animations:!s.animations}))}><i/></button></div><div className="settings-control"><div><b>Particles & effects</b><span>Decorative visual effects</span></div><button className={`toggle ${settings.particles?'on':''}`} onClick={()=>setSettings(s=>({...s,particles:!s.particles}))}><i/></button></div></div>
        <div className="panel settings-section"><div className="panel-heading"><div><h3>Training preferences</h3><p>Your defaults for future sessions.</p></div><Crosshair size={17}/></div><div className="settings-control"><div><b>Default difficulty</b><span>Used when opening a training mode</span></div><DiffPicker/></div><div className="settings-control"><div><b>Crosshair color</b><span>Used in aim exercises</span></div><input type="color" value={settings.crosshair} onChange={e=>setSettings(s=>({...s,crosshair:e.target.value}))}/></div><div className="settings-control"><div><b>Crosshair size</b><span>{settings.crosshairSize}px</span></div><input className="range-input short-range" type="range" min="8" max="36" value={settings.crosshairSize} onChange={e=>setSettings(s=>({...s,crosshairSize:Number(e.target.value)}))}/></div><div className="settings-control"><div><b>Mouse sensitivity</b><span>{settings.sensitivity.toFixed(1)} · training simulation only</span></div><input className="range-input short-range" type="range" min="1" max="20" step=".1" value={settings.sensitivity} onChange={e=>setSettings(s=>({...s,sensitivity:Number(e.target.value)}))}/></div><button className="secondary-button full" onClick={()=>{setSettings({theme:'Dark',graphics:'High',fps:'60',animations:true,particles:true,crosshair:'#7c8cff',crosshairSize:18,sensitivity:6.5,binds:{forward:'W',left:'A',back:'S',right:'D',shoot:'Mouse 1'}});setToast('Settings restored to defaults.')}}><RotateCcw size={15}/> Reset to defaults</button></div></div>
        <div className="panel account-panel"><div className="panel-heading"><div><h3>Account & privacy</h3><p>Manage your profile and progress.</p></div><LockKeyhole size={17}/></div><div className="account-info"><div className="avatar large-avatar">{username.slice(0,2).toUpperCase()}</div><div><b>{displayName}</b><span>@{username} · {userId?'Online account':'Local demo profile'}</span></div><button className="secondary-button compact" onClick={()=>userId?signOut():setAuthOpen(true)}>{userId?'Sign out':'Sign in'}</button></div><p className="fine-print">Demo mode stores your settings and guest XP in this browser only. To save progress across devices, connect the Supabase backend using the setup guide.</p></div>
      </div>}

      <footer className="app-footer"><div><div className="brand-mark mini">SS</div><span>SS Training <small>· Train with purpose.</small></span></div><span>Built for steady progress.</span><button onClick={()=>setToast('Help center content can be added through the admin dashboard.')}><CircleHelp size={14}/> Help</button></footer>
    </main>

    {authOpen&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setAuthOpen(false)}}><div className="auth-modal"><button className="modal-close icon-button" onClick={()=>setAuthOpen(false)}><X size={18}/></button><div className="modal-brand brand-mark">SS</div><span className="eyebrow">YOUR TRAINING ID</span><h2>{authMode==='signup'?'Start your journey.':'Welcome back.'}</h2><p>Save your progress, keep your streak, and compete on the leaderboard.</p><div className="auth-tabs"><button className={authMode==='signup'?'selected':''} onClick={()=>{setAuthMode('signup');setAuthError('')}}>Create account</button><button className={authMode==='signin'?'selected':''} onClick={()=>{setAuthMode('signin');setAuthError('')}}>Sign in</button></div><form onSubmit={authMode==='signup'?signUp:signIn}>{authMode==='signup'&&<label>Display name<input name="displayName" placeholder="How should we call you?" autoComplete="nickname"/></label>}<label>Username<input name="username" placeholder="e.g. SSZN" autoComplete="username" required minLength={3}/></label><label>Password<input name="password" placeholder="At least 10 characters" type="password" autoComplete={authMode==='signup'?'new-password':'current-password'} required minLength={authMode==='signup'?10:1}/></label>{authError&&<div className="auth-error">{authError}</div>}<button className="primary-button full" disabled={authBusy}>{authBusy?'Please wait…':authMode==='signup'?'Create account':'Sign in'} <ChevronRight size={15}/></button></form><div className="auth-foot"><LockKeyhole size={13}/> Passwords are handled by the authentication provider.</div></div></div>}
    {toast&&<div className="toast"><CheckCircle2 size={16}/>{toast}<button onClick={()=>setToast('')}><X size={14}/></button></div>}
    {!isSupabaseConfigured&&<div className="demo-banner"><span className="demo-dot"/> PREVIEW MODE <span>Connect Supabase to enable online accounts, shared XP, and real rankings.</span><button onClick={()=>setAuthOpen(true)}>Set up account <ChevronRight size={13}/></button></div>}
  </div>;
}

function SnakeGame({onScore,onFinish}:{onScore:(n:number)=>void;onFinish:(n:number)=>void}) {
  const [snake,setSnake]=useState([{x:7,y:7},{x:6,y:7},{x:5,y:7}]);
  const [food,setFood]=useState({x:12,y:7});
  const [dir,setDir]=useState({x:1,y:0});
  const [running,setRunning]=useState(false);
  const [score,setScore]=useState(0);
  const [over,setOver]=useState(false);
  useEffect(()=>{
    const key=(e:KeyboardEvent)=>{const map:{[k:string]:{x:number;y:number}}={ArrowUp:{x:0,y:-1},w:{x:0,y:-1},ArrowDown:{x:0,y:1},s:{x:0,y:1},ArrowLeft:{x:-1,y:0},a:{x:-1,y:0},ArrowRight:{x:1,y:0},d:{x:1,y:0}};const nd=map[e.key];if(nd&&!(nd.x===-dir.x&&nd.y===-dir.y)){setDir(nd);if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))e.preventDefault();}};
    window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
  },[dir]);
  useEffect(()=>{
    if(!running)return;
    const id=window.setInterval(()=>{
      setSnake(old=>{
        const head={x:old[0].x+dir.x,y:old[0].y+dir.y};
        if(head.x<0||head.x>=20||head.y<0||head.y>=14||old.some(p=>p.x===head.x&&p.y===head.y)){setRunning(false);setOver(true);onFinish(score);return old;}
        const ate=head.x===food.x&&head.y===food.y;
        const next=[head,...old.slice(0,ate?old.length:old.length-1)];
        if(ate){setScore(s=>{onScore(s+1);return s+1});setFood({x:Math.floor(Math.random()*20),y:Math.floor(Math.random()*14)});}
        return next;
      });
    },145);return()=>window.clearInterval(id);
  },[running,dir,food,score]);
  function reset(){setSnake([{x:7,y:7},{x:6,y:7},{x:5,y:7}]);setFood({x:12,y:7});setDir({x:1,y:0});setScore(0);setOver(false);setRunning(true);}
  return <div className="snake-wrap"><div className="snake-top"><span>Score <b>{score}</b></span><span>Use WASD or arrow keys</span></div><div className="snake-board">{Array.from({length:280},(_,i)=>{const x=i%20,y=Math.floor(i/20);const isSnake=snake.some(p=>p.x===x&&p.y===y);const isHead=snake[0].x===x&&snake[0].y===y;return <i key={i} className={`${isSnake?'snake-cell':''} ${isHead?'snake-head':''} ${food.x===x&&food.y===y?'snake-food':''}`}/>})}{(!running)&&<div className="snake-overlay"><h3>{over?'Round complete':'Ready to play?'}</h3><p>{over?`You scored ${score}.`:'Collect the dots. Avoid the edges and yourself.'}</p><button className="primary-button" onClick={reset}>{over?'Play again':'Start Snake'} <Play size={14}/></button></div>}</div></div>;
}

function RhythmTrainer({onComplete}:{onComplete:(n:number)=>void}) {
  const [started,setStarted]=useState(false);
  const [beat,setBeat]=useState(0);
  const [hits,setHits]=useState(0);
  const [last,setLast]=useState('Press start, then tap with the beat.');
  useEffect(()=>{if(!started)return;const id=window.setInterval(()=>setBeat(b=>b+1),800);return()=>window.clearInterval(id);},[started]);
  function tap(){if(!started){setStarted(true);setLast('Follow the pulse. Tap Space or the button.');return;}setHits(h=>h+1);setLast('Beat registered · keep a steady rhythm.');if(hits>=9){setStarted(false);onComplete(5);setLast('Set complete. Nice consistency.');}}
  useEffect(()=>{const k=(e:KeyboardEvent)=>{if(e.code==='Space'&&started){e.preventDefault();tap();}};window.addEventListener('keydown',k);return()=>window.removeEventListener('keydown',k);});
  return <div className="rhythm-layout"><div className="panel rhythm-panel"><div className="panel-heading"><div><h3>Pulse trainer</h3><p>Tap along to the visual beat.</p></div><span className="pill">SET {started?'IN PROGRESS':'READY'}</span></div><div className={`beat-stage ${started&&beat%2===0?'beat-on':''}`}><div className="beat-rings"><i/><i/><i/><div className="beat-core"><AudioLines size={27}/></div></div><div className="beat-label">{started?'FOLLOW THE PULSE':'FIND YOUR RHYTHM'}</div></div><div className="rhythm-stats"><div><span>Registered taps</span><b>{hits}/10</b></div><div><span>Tempo</span><b>75 <small>BPM</small></b></div><div><span>Progress</span><b>{hits*10}%</b></div></div><button className="primary-button full" onClick={tap}>{started?'Tap to the beat':'Start rhythm set'} <ChevronRight size={15}/></button><p className="fine-print">{last}</p></div><div className="panel rhythm-side"><div className="large-icon purple"><Activity size={21}/></div><h3>Timing is a skill.</h3><p>Focus on consistency, not speed. A steady rhythm is the foundation of accurate timing.</p><div className="rhythm-tips"><div><CheckCircle2 size={15}/><span>Keep a relaxed pace</span></div><div><CheckCircle2 size={15}/><span>Use the visual pulse</span></div><div><CheckCircle2 size={15}/><span>Repeat to improve</span></div></div></div></div>;
}

export default App;
