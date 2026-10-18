// ============================================
// HerGuardian v2 — Dashboard (Final)
// Unified SOS: button + voice + shake → same trigger
// All safety tools integrated in SOS tab
// Single AI assistant for all modules
// Safety Map: auto-fills from GPS + shows police/hospitals
// Health Hub + Forum: real links to articles/videos
// ============================================
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sosAPI, healthAPI, forumAPI, mapAPI, aiAPI } from '../services/api';
import axios from 'axios';
import { apiUrl } from '../config';
import styles from './Dashboard.module.css';

const MOODS = [
  { id:'happy',    emoji:'😊', label:'Happy'     },
  { id:'calm',     emoji:'😌', label:'Calm'      },
  { id:'tired',    emoji:'😴', label:'Tired'     },
  { id:'anxious',  emoji:'😰', label:'Anxious'   },
  { id:'sad',      emoji:'😢', label:'Sad'       },
  { id:'energized',emoji:'⚡', label:'Energized' },
];

// Health articles — stable government/wiki URLs that never go 404
const HEALTH_ARTICLES = [
  { title:'Menstrual Cycle — Wikipedia', src:'Wikipedia', url:'https://en.wikipedia.org/wiki/Menstrual_cycle', icon:'🌸', tag:'Cycle' },
  { title:'Period Pain (Dysmenorrhoea)', src:'NHS UK', url:'https://www.nhs.uk/conditions/period-pain/', icon:'💊', tag:'Pain Relief' },
  { title:'Polycystic Ovary Syndrome (PCOS)', src:'NHS UK', url:'https://www.nhs.uk/conditions/polycystic-ovary-syndrome-pcos/', icon:'🩺', tag:'PCOS' },
  { title:'Iron Deficiency Anaemia', src:'NHS UK', url:'https://www.nhs.uk/conditions/iron-deficiency-anaemia/', icon:'🩸', tag:'Nutrition' },
  { title:'Endometriosis', src:'NHS UK', url:'https://www.nhs.uk/conditions/endometriosis/', icon:'🔬', tag:'Conditions' },
  { title:"Women's Mental Health", src:'Wikipedia', url:'https://en.wikipedia.org/wiki/Women%27s_mental_health', icon:'🧠', tag:'Mental Health' },
];

// Wellness: YouTube search URLs always resolve (no dead video links)
const WELLNESS_VIDEOS = [
  { title:'Breathing Exercises for Anxiety', channel:'YouTube Search', url:'https://www.youtube.com/results?search_query=breathing+exercises+anxiety+relief', thumb:'🧘‍♀️' },
  { title:'Yoga for Period Pain Relief', channel:'YouTube Search', url:'https://www.youtube.com/results?search_query=yoga+period+pain+relief', thumb:'🌿' },
  { title:'5-4-3-2-1 Grounding Technique', channel:'YouTube Search', url:'https://www.youtube.com/results?search_query=5+4+3+2+1+grounding+anxiety', thumb:'💆‍♀️' },
  { title:'Guided Body Scan Meditation', channel:'YouTube Search', url:'https://www.youtube.com/results?search_query=body+scan+meditation+guided', thumb:'💜' },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab]         = useState('home');
  const [toast, setToast]     = useState(null);

  // ── SOS + Safety state (all unified) ────────
  const [sosSending, setSosSending]     = useState(false);
  const [sosResult, setSosResult]       = useState(null);
  const [sosActive, setSosActive]       = useState(false); // full SOS mode active
  const [customMsg, setCustomMsg]       = useState('');
  const [sosHistory, setSosHistory]     = useState([]);
  const [evidenceImg, setEvidenceImg]   = useState(null);

  // Voice SOS
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const recognitionRef = useRef(null);

  // Shake SOS
  const [shakeArmed, setShakeArmed]     = useState(false);
  const [shakeCount, setShakeCount]     = useState(0);
  const lastShakeRef  = useRef(0);
  const shakeBurstRef = useRef(0);

  // Fake call
  const [fakeCallRinging, setFakeCallRinging] = useState(false);
  const [fakeCallAnswered, setFakeCallAnswered] = useState(false);
  const [fakeCallerName, setFakeCallerName]   = useState('Mom');

  // Walk timer / check-in (auto-armed after SOS)
  const [walkActive, setWalkActive]     = useState(false);
  const [walkMinutes, setWalkMinutes]   = useState(15);
  const [walkSecondsLeft, setWalkSecondsLeft] = useState(0);
  const walkTimerRef  = useRef(null);

  // Live location
  const [shareActive, setShareActive]   = useState(false);
  const [shareLink, setShareLink]       = useState('');
  const [liveCoords, setLiveCoords]     = useState(null);
  const locationWatchRef = useRef(null);

  // Contacts
  const [contacts, setContacts]         = useState(user?.trustedContacts || []);
  const [newContact, setNewContact]     = useState({ name:'', phone:'', email:'' });

  // Camera refs for evidence
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);

  // ── Health state ─────────────────────────────
  const [cycles, setCycles]             = useState([]);
  const [moods, setMoods]               = useState([]);
  const [periodForm, setPeriodForm]     = useState({ periodStart:'', periodEnd:'', cycleLength:28 });
  const [selectedMood, setSelectedMood] = useState('');
  const [moodNote, setMoodNote]         = useState('');
  const [energyLevel, setEnergyLevel]   = useState(5);
  const [healthInsights, setHealthInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // ── Single AI assistant (all modules) ────────
  const [chatMessages, setChatMessages] = useState([
    { role:'assistant', content:'Namaste! 🌸 I\'m HerGuardian\'s AI Assistant.\n\nI can help you with:\n• ⚖️ Legal rights (POSH, POCSO, Domestic Violence, Zero FIR)\n• 🌸 Health questions (periods, PCOS, nutrition, mood)\n• 🛡️ Safety tips and what to do in emergencies\n• 💬 Emotional support and coping strategies\n\nWhat would you like to know? In an emergency, call 112 or Mahila Helpline: 181.' }
  ]);
  const [chatInput, setChatInput]       = useState('');
  const [chatLoading, setChatLoading]   = useState(false);
  const chatEndRef = useRef(null);

  // ── Forum state ───────────────────────────────
  const [posts, setPosts]               = useState([]);
  const [postForm, setPostForm]         = useState({ title:'', content:'', tag:'support', isAnonymous:true });
  const [showPostForm, setShowPostForm] = useState(false);

  // ── Map state ────────────────────────────────
  const [zones, setZones]               = useState([]);
  const [mapLoading, setMapLoading]     = useState(false);
  const [myLocation, setMyLocation]     = useState(null);
  const [nearbyPlaces, setNearbyPlaces] = useState({ police:[], hospitals:[] });
  const [autoReport, setAutoReport]     = useState({ safetyScore:7, lightingScore:7, crowdDensity:'medium', address:'' });
  const [locationLoading, setLocationLoading] = useState(false);

  const showToast = (msg, type='success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  // ── Audio context for ringtone (Web Audio API) ─
  const audioCtxRef   = useRef(null);
  const ringtoneNodes = useRef([]);

  // ── Stable refs so event listeners always call latest version ──
  // (Avoids stale closure problem with useEffect + useCallback ordering)
  const triggerSOSRef  = useRef(null); // set after triggerSOS is defined
  const shakeHandlerRef = useRef(null); // stable ref for devicemotion listener

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [chatMessages]);
  useEffect(() => { if (tab === 'sos')     loadSOSHistory(); }, [tab]);
  useEffect(() => { if (tab === 'health')  loadHealthData(); }, [tab]);
  useEffect(() => { if (tab === 'wellness') loadForum(); }, [tab]);
  useEffect(() => { if (tab === 'map')     loadMapData(); }, [tab]);
  useEffect(() => { if (tab === 'profile') setContacts(user?.trustedContacts || []); }, [tab]);

  const loadSOSHistory = async () => { try { const r = await sosAPI.getHistory(); setSosHistory(r.data.history || []); } catch {} };
  const loadHealthData = async () => { try { const [c, m] = await Promise.all([healthAPI.getCycleData(), healthAPI.getMoodHistory()]); setCycles(c.data.cycles || []); setMoods(m.data.moods || []); } catch {} };
  const loadForum      = async () => { try { const r = await forumAPI.getPosts(); setPosts(r.data.posts || []); } catch {} };

  // ── Shake handler — defined once, uses ref so always has latest triggerSOS ──
  // This function is stored in shakeHandlerRef and added as event listener
  const onDeviceMotion = (e) => {
    const acc = e.acceleration || e.accelerationIncludingGravity;
    if (!acc) return;
    const total = Math.abs(acc.x || 0) + Math.abs(acc.y || 0) + Math.abs(acc.z || 0);
    const now = Date.now();
    if (total > 20 && now - lastShakeRef.current > 250) {
      lastShakeRef.current = now;
      shakeBurstRef.current += 1;
      setShakeCount(shakeBurstRef.current);
      if (shakeBurstRef.current >= 5) {
        shakeBurstRef.current = 0;
        setShakeCount(0);
        triggerSOSRef.current?.('shake');
      }
      // Reset burst after 3s of no shaking
      clearTimeout(shakeBurstRef.resetTimer);
      shakeBurstRef.resetTimer = setTimeout(() => {
        shakeBurstRef.current = 0;
        setShakeCount(0);
      }, 3000);
    }
  };

  // Store in ref so we can add/remove the same function reference
  shakeHandlerRef.current = onDeviceMotion;

  // Wrapper that always delegates to the ref — this is what gets added to addEventListener
  // It is defined once at module level so add/removeEventListener use the same identity
  // We use a ref-forwarding pattern instead
  const stableShakeListener = useRef((e) => shakeHandlerRef.current(e));

  // ── AUTO-START voice + shake on mount ─────────
  // Voice: auto-starts, auto-restarts on end
  // Shake: auto-armed on Android; first SOS button tap arms it on iOS
  useEffect(() => {
    // ── VOICE SOS ──
    // Uses a ref for the "mounted" flag so SOS trigger can reset it
    // without being trapped inside a stale closure
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const TRIGGERS = ['help','help me','send sos','emergency','call police','i need help',
        'mayday','danger','bachao','madad karo','police bulao','help karo','bachao mujhe','sos'];

      // Use a plain object so inner closures always read the latest value
      const state = { mounted: true, firing: false };

      const startVoice = () => {
        if (!state.mounted) return;
        state.firing = false; // reset firing flag every time we (re)start

        const r = new SR();
        r.continuous      = true;
        r.interimResults  = true;
        r.lang            = 'en-IN';
        r.maxAlternatives = 1;

        r.onstart = () => { if (state.mounted) setVoiceListening(true); };

        r.onresult = (ev) => {
          let text = '';
          for (let i = 0; i < ev.results.length; i++) {
            text += ev.results[i][0].transcript + ' ';
          }
          text = text.toLowerCase().trim();
          if (state.mounted) setVoiceTranscript(text);

          const matched = TRIGGERS.find(t => text.includes(t));
          if (matched && state.mounted && !state.firing) {
            state.firing = true; // block double-fire for THIS session only
            try { r.stop(); } catch {}
            setVoiceListening(false);
            setVoiceTranscript('');
            triggerSOSRef.current?.('voice');
            // After SOS fires, restart listening after 8 seconds
            // (gives time for SOS to complete before mic opens again)
            setTimeout(() => { if (state.mounted) startVoice(); }, 8000);
          }
        };

        r.onerror = (ev) => {
          if (ev.error === 'not-allowed') {
            // Mic permission denied — stop trying
            setVoiceListening(false);
            state.mounted = false;
          }
          // All other errors (no-speech, audio-capture, network) —
          // onend will fire and auto-restart
        };

        r.onend = () => {
          setVoiceListening(false);
          // Only auto-restart if we didn't just fire SOS
          // (SOS path has its own 8s restart above)
          if (state.mounted && !state.firing) {
            setTimeout(() => { if (state.mounted) startVoice(); }, 1500);
          }
        };

        recognitionRef.current = r;
        try {
          r.start();
        } catch {
          setTimeout(() => { if (state.mounted) startVoice(); }, 3000);
        }
      };

      startVoice();

      return () => {
        state.mounted = false;
        state.firing  = false;
        try { recognitionRef.current?.stop(); } catch {}
      };
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── SHAKE SOS auto-arm ──
  useEffect(() => {
    const listener = stableShakeListener.current;
    if (typeof DeviceMotionEvent?.requestPermission === 'function') {
      // iOS — cannot auto-arm without user gesture; armShakeIOS() called on SOS button tap
    } else {
      // Android / Desktop — arm immediately
      window.addEventListener('devicemotion', listener, { passive: true });
      setShakeArmed(true);
    }
    return () => {
      window.removeEventListener('devicemotion', listener);
      clearInterval(walkTimerRef.current);
      if (locationWatchRef.current) navigator.geolocation.clearWatch(locationWatchRef.current);
      try { audioCtxRef.current?.close(); } catch {}
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // iOS — called on first SOS button tap (requires user gesture)
  const armShakeIOS = () => {
    if (typeof DeviceMotionEvent?.requestPermission === 'function' && !shakeArmed) {
      DeviceMotionEvent.requestPermission()
        .then(p => {
          if (p === 'granted') {
            window.addEventListener('devicemotion', stableShakeListener.current, { passive: true });
            setShakeArmed(true);
          }
        })
        .catch(() => {});
    }
  };

  // ── Web Audio ringtone (real sound, no file needed) ──
  const playRingtone = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
      const loop = () => {
        if (!audioCtxRef.current) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine';
        // Classic phone ring: two tones alternating
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(660, ctx.currentTime + 0.2);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.6, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.8);
        ringtoneNodes.current.push(osc);
        osc.onended = () => { if (audioCtxRef.current) setTimeout(loop, 500); };
      };
      loop();
    } catch {}
  };

  const stopRingtone = () => {
    ringtoneNodes.current.forEach(n => { try { n.stop(); } catch {} });
    ringtoneNodes.current = [];
    try { audioCtxRef.current?.close(); } catch {}
    audioCtxRef.current = null;
  };

  // ── SAFETY MAP: auto-fill from GPS ────────────
  const loadMapData = useCallback(async () => {
    setMapLoading(true);
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setMyLocation({ lat, lng });

      // Auto-compute safety scores based on time of day
      const hour = new Date().getHours();
      const isNight = hour >= 21 || hour <= 5;
      const isLateNight = hour >= 23 || hour <= 4;
      const isEvening = hour >= 18 && hour < 21;
      const isMorning = hour >= 6 && hour <= 9;

      const safetyScore   = isLateNight ? 3 : isNight ? 5 : isEvening ? 6 : 8;
      const lightingScore = isLateNight ? 2 : isNight ? 4 : isEvening ? 5 : 9;
      const crowdDensity  = isLateNight ? 'low' : (isNight || isMorning) ? 'medium' : 'high';

      setAutoReport(prev => ({ ...prev, safetyScore, lightingScore, crowdDensity }));
      try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`);
        const geoData = await geoRes.json();
        const address = geoData.display_name?.split(',').slice(0,3).join(', ') || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        setAutoReport(prev => ({ ...prev, address }));
      } catch {
        setAutoReport(prev => ({ ...prev, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` }));
      }

      // Fetch nearby zones from backend
      try {
        const r = await mapAPI.getZones(lat, lng);
        setZones(r.data.zones || []);
      } catch {}

      // Fetch nearest police stations + hospitals via Overpass API (free OSM)
      try {
        const overpassQuery = `
          [out:json][timeout:10];
          (
            node["amenity"="police"](around:3000,${lat},${lng});
            node["amenity"="hospital"](around:3000,${lat},${lng});
            node["amenity"="clinic"](around:3000,${lat},${lng});
          );
          out body 10;
        `;
        const overpassRes = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`);
        const overpassData = await overpassRes.json();
        const elements = overpassData.elements || [];
        const police    = elements.filter(e => e.tags?.amenity === 'police').slice(0, 3).map(e => ({
          name:    e.tags?.name || 'Police Station',
          lat:     e.lat, lng: e.lon,
          dist:    getDistKm(lat, lng, e.lat, e.lon),
          mapsUrl: `https://maps.google.com/?q=${e.lat},${e.lon}`,
        }));
        const hospitals = elements.filter(e => ['hospital','clinic'].includes(e.tags?.amenity)).slice(0, 3).map(e => ({
          name:    e.tags?.name || (e.tags?.amenity === 'hospital' ? 'Hospital' : 'Clinic'),
          lat:     e.lat, lng: e.lon,
          dist:    getDistKm(lat, lng, e.lat, e.lon),
          mapsUrl: `https://maps.google.com/?q=${e.lat},${e.lon}`,
        }));
        setNearbyPlaces({ police, hospitals });
      } catch {}

      setMapLoading(false);
      setLocationLoading(false);
    }, () => {
      showToast('Enable location to use Safety Map', 'error');
      setMapLoading(false);
      setLocationLoading(false);
    });
  }, []);

  // Haversine distance (km)
  const getDistKm = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2-lat1)*Math.PI/180;
    const dLng = (lng2-lng1)*Math.PI/180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1);
  };

  // ── EVIDENCE CAPTURE ──────────────────────────
  const captureEvidence = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode:'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        await new Promise(r => setTimeout(r, 800));
        if (canvasRef.current) {
          canvasRef.current.width  = videoRef.current.videoWidth  || 640;
          canvasRef.current.height = videoRef.current.videoHeight || 480;
          canvasRef.current.getContext('2d').drawImage(videoRef.current, 0, 0);
          setEvidenceImg(canvasRef.current.toDataURL('image/jpeg', 0.8));
          stream.getTracks().forEach(t => t.stop());
        }
      }
    } catch {}
  }, []);

  // ══════════════════════════════════════════════
  // MASTER SOS TRIGGER — called by ALL methods
  // Button click / Voice keyword / Shake
  // ══════════════════════════════════════════════
  const triggerSOS = useCallback(async (triggeredBy = 'manual') => {
    if (sosSending) return;
    setSosSending(true);
    setSosActive(true);
    setSosResult(null);

    // iOS: arm shake on first interaction (requires user gesture)
    armShakeIOS();

    // 1. Capture evidence photo silently
    captureEvidence();

    // 2. Get GPS
    const coords = await new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        p => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
        () => resolve({})
      );
    });

    // 3. Start live location share automatically
    startLiveLocation();

    // 4. Ring fake call with REAL AUDIO
    triggerFakeCall();

    // 5. Send SOS to contacts
    try {
      const r = await sosAPI.send({
        ...coords,
        message:       customMsg || 'EMERGENCY! I need immediate help!',
        evidenceImage: evidenceImg || undefined,
        triggeredBy,
      });
      setSosResult(r.data);
      showToast(`🚨 SOS sent to ${r.data.alertsSent?.length} contacts!`, 'error');
      loadSOSHistory();
    } catch (e) {
      showToast(e.response?.data?.error || '🚨 Call 112 immediately!', 'error');
    } finally {
      setSosSending(false);
    }

    // 6. Start safety check-in timer (auto-armed after SOS)
    startCheckInTimer();
  }, [sosSending, customMsg, evidenceImg, captureEvidence]); // eslint-disable-line

  // Keep ref in sync so auto-started voice/shake handlers can call it
  useEffect(() => { triggerSOSRef.current = triggerSOS; }, [triggerSOS]);

  // ── FAKE CALL: REAL AUDIO ringtone ─────────────
  const triggerFakeCall = () => {
    try { navigator.vibrate?.([500, 200, 500, 200, 500, 200, 500, 200, 500]); } catch {}
    playRingtone(); // Web Audio API — actual ringing sound
    setFakeCallRinging(true);
  };
  const answerFakeCall = () => {
    stopRingtone();
    setFakeCallRinging(false);
    setFakeCallAnswered(true);
    try { navigator.vibrate?.(100); } catch {}
  };
  const endFakeCall = () => {
    stopRingtone();
    setFakeCallRinging(false);
    setFakeCallAnswered(false);
  };

  // ── LIVE LOCATION: auto-start on SOS ──────────
  const startLiveLocation = () => {
    if (shareActive) return;
    const watchId = navigator.geolocation.watchPosition(pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      setLiveCoords({ lat, lng });
      setShareLink(`https://maps.google.com/?q=${lat},${lng}`);
    }, () => {}, { enableHighAccuracy: true });
    locationWatchRef.current = watchId;
    setShareActive(true);
  };
  const stopLiveLocation = () => {
    if (locationWatchRef.current) navigator.geolocation.clearWatch(locationWatchRef.current);
    setShareActive(false); setShareLink(''); setLiveCoords(null);
  };

  // ── WALK TIMER / CHECK-IN: auto-armed after SOS ─
  const startCheckInTimer = () => {
    const secs = walkMinutes * 60;
    setWalkSecondsLeft(secs);
    setWalkActive(true);
    clearInterval(walkTimerRef.current);
    walkTimerRef.current = setInterval(() => {
      setWalkSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(walkTimerRef.current);
          setWalkActive(false);
          triggerSOS('missed_checkin');
          return 0;
        }
        if (prev === 120 || prev === 60 || prev === 30) {
          showToast(`⚠️ ${prev}s left — tap "I'm Safe" or SOS fires again!`, 'error');
          try { navigator.vibrate?.([300, 100, 300]); } catch {}
        }
        return prev - 1;
      });
    }, 1000);
  };
  const confirmSafe = () => {
    clearInterval(walkTimerRef.current);
    setWalkActive(false);
    setWalkSecondsLeft(0);
    showToast("✅ You're marked safe! All alerts paused.", 'success');
    try { navigator.vibrate?.(100); } catch {}
  };
  const formatTime = s => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;



  // ── REPORT ZONE (auto-filled from GPS) ────────
  const reportZone = async (type) => {
    if (!myLocation) { showToast('Getting your location…', 'error'); return; }
    try {
      await mapAPI.reportZone({ latitude: myLocation.lat, longitude: myLocation.lng, ...autoReport, type });
      showToast(`${type==='safe' ? '✅ Safe' : '⚠️ Unsafe'} zone reported! Thank you.`);
      loadMapData();
    } catch { showToast('Could not submit report', 'error'); }
  };

  // ── HEALTH functions ──────────────────────────
  const logPeriod = async () => {
    if (!periodForm.periodStart) { showToast('Select period start date', 'error'); return; }
    try { await healthAPI.logPeriod(periodForm); showToast('Period logged! 🌸'); setPeriodForm({ periodStart:'', periodEnd:'', cycleLength:28 }); loadHealthData(); }
    catch { showToast('Could not save cycle data', 'error'); }
  };
  const logMood = async () => {
    if (!selectedMood) { showToast('Select a mood', 'error'); return; }
    try { await healthAPI.logMood({ mood:selectedMood, moodEmoji:MOODS.find(m=>m.id===selectedMood)?.emoji, note:moodNote, energyLevel }); showToast('Mood logged! 💜'); setSelectedMood(''); setMoodNote(''); setEnergyLevel(5); loadHealthData(); }
    catch { showToast('Could not save mood', 'error'); }
  };
  const getHealthInsights = async () => {
    setInsightsLoading(true);
    try { const r = await aiAPI.healthInsights(); setHealthInsights(r.data); }
    catch { showToast('Could not get insights — check Anthropic API key', 'error'); }
    finally { setInsightsLoading(false); }
  };

  // ── SINGLE AI CHAT (all modules) ──────────────
  const sendChat = async (msgOverride) => {
    const msg = msgOverride || chatInput;
    if (!msg.trim()) return;
    setChatMessages(prev => [...prev, { role:'user', content:msg }]);
    setChatInput(''); setChatLoading(true);
    try {
      const r = await aiAPI.chat({ message: msg, history: chatMessages.slice(-10) });
      setChatMessages(prev => [...prev, { role:'assistant', content:r.data.reply }]);
    } catch {
      setChatMessages(prev => [...prev, { role:'assistant', content:'⚠️ AI unavailable. For emergencies call 112 or Mahila Helpline: 181.' }]);
    } finally { setChatLoading(false); }
  };

  // ── FORUM ─────────────────────────────────────
  const createPost = async () => {
    if (!postForm.title || !postForm.content) { showToast('Fill in title and content', 'error'); return; }
    try { await forumAPI.createPost(postForm); showToast('Post published! 💜'); setPostForm({ title:'', content:'', tag:'support', isAnonymous:true }); setShowPostForm(false); }
    catch { showToast('Could not create post', 'error'); }
  };

  // ── CONTACTS ──────────────────────────────────
  const saveContacts = async () => {
    try {
      const r = await axios.put('/api/auth/contacts', { contacts });
      if (Array.isArray(r.data?.trustedContacts)) setContacts(r.data.trustedContacts.map(({ name, phone, email }) => ({ name, phone, email }))); // show the normalised +91… numbers
      showToast('Contacts saved! ✅');
    } catch (e) { showToast(e.response?.data?.error || 'Could not save contacts', 'error'); }
  };
  const addContact   = () => {
    if (!newContact.name || !newContact.phone || !newContact.email) { showToast('Fill all contact fields', 'error'); return; }
    if (contacts.length >= 5) { showToast('Max 5 contacts', 'error'); return; }
    setContacts([...contacts, { ...newContact }]); setNewContact({ name:'', phone:'', email:'' });
  };
  const removeContact = i => setContacts(contacts.filter((_,idx) => idx!==i));

  // ── Cycle phase ───────────────────────────────
  const getCyclePhase = () => {
    if (!cycles[0]) return null;
    const d = Math.floor((new Date() - new Date(cycles[0].periodStart)) / 86400000);
    if (d<=5)  return { phase:'Menstrual',    color:'#e8758a', day:d };
    if (d<=13) return { phase:'Follicular',   color:'#f9a825', day:d };
    if (d<=15) return { phase:'Ovulation',    color:'#66bb6a', day:d };
    if (d<=26) return { phase:'Luteal',       color:'#ab47bc', day:d };
    return         { phase:'Pre-Menstrual', color:'#ef5350', day:d };
  };
  const cyclePhase = getCyclePhase();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className={styles.page}>
      {/* Toast */}
      {toast && <div className={`${styles.toast} ${styles[toast.type]}`}>{toast.msg}</div>}

      {/* Email verify banner */}
      {user && !user.isEmailVerified && (
        <div className={styles.verifyBanner}>
          📧 Verify your email to enable SOS alerts.
          <button className={styles.verifyBtn} onClick={async () => {
            await fetch(apiUrl('/api/auth/resend-verification'), { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email:user.email }) });
            showToast('Verification email sent!');
          }}>Resend Email</button>
        </div>
      )}

      {/* Hidden camera elements */}
      <video ref={videoRef} style={{ display:'none' }} muted playsInline />
      <canvas ref={canvasRef} style={{ display:'none' }} />

      {/* Fake call overlay — full screen, loud */}
      {fakeCallRinging && (
        <div className={styles.callOverlay}>
          <div className={styles.callCard}>
            <div className={styles.callRingIcon}>📱</div>
            <div className={styles.callerName}>{fakeCallerName}</div>
            <div className={styles.callerSub}>Incoming call…</div>
            <div className={styles.callBtns}>
              <button className={styles.callDecline} onClick={endFakeCall}>🔴</button>
              <button className={styles.callAnswer}  onClick={answerFakeCall}>🟢</button>
            </div>
          </div>
        </div>
      )}
      {fakeCallAnswered && (
        <div className={styles.callOverlay}>
          <div className={styles.callCard}>
            <div className={styles.callRingIcon}>📞</div>
            <div className={styles.callerName}>{fakeCallerName}</div>
            <div className={styles.callerSub}>On call…</div>
            <div className={styles.callScript}>
              "Hey! Yes, I'm on my way. Actually wait — can you come pick me up right now? I'm at [your location]. Yes, now please. See you in 5 minutes!"
            </div>
            <button className={styles.callEndBtn} onClick={endFakeCall}>End Call</button>
          </div>
        </div>
      )}

      {/* Check-in banner (shows across all tabs when active) */}
      {walkActive && (
        <div className={styles.checkInBanner}>
          <span>⏱️ Safety Check-In: <strong className={walkSecondsLeft<=60 ? styles.timerRed : ''}>{formatTime(walkSecondsLeft)}</strong> — confirm you're safe or SOS auto-fires</span>
          <button className={styles.safeBtn} onClick={confirmSafe}>✅ I'm Safe</button>
        </div>
      )}

      {/* Topbar */}
      <div className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <div className={styles.avatar}>{user?.name?.[0]||'U'}</div>
          <div>
            <div className={styles.welcome}>Welcome, {user?.name?.split(' ')[0]} ✨</div>
            <div className={styles.location}>{new Date().toLocaleDateString('en-IN',{weekday:'long',month:'short',day:'numeric'})}</div>
          </div>
        </div>
        <div className={styles.topbarRight}>
          {cyclePhase && <div className={styles.pill} style={{background:cyclePhase.color+'22',color:cyclePhase.color}}>🌸 {cyclePhase.phase} · Day {cyclePhase.day}</div>}
          {shareActive && liveCoords && (
            <a href={shareLink} target="_blank" rel="noreferrer" className={`${styles.pill} ${styles.livePill}`}>📍 LIVE</a>
          )}
          <button className={styles.logoutBtn} onClick={handleLogout}>Sign Out</button>
        </div>
      </div>

      <div className={styles.body}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          {[['home','🏠','Overview'],['sos','🚨','Emergency SOS'],['health','🌸','Health Hub'],['legal','⚖️','Legal Info'],['ai','🤖','AI Assistant'],['wellness','💬','Forum'],['map','🗺️','Safety Map'],['profile','👤','My Profile']].map(([id,ic,label]) => (
            <div key={id} className={`${styles.navItem} ${tab===id?styles.navActive:''} ${id==='sos'?styles.navSOS:''}`} onClick={() => setTab(id)}>
              <span className={styles.navIcon}>{ic}</span>{label}
            </div>
          ))}
        </aside>

        {/* Main content */}
        <main className={styles.main}>

          {/* ══ HOME ══ */}
          {tab==='home' && (
            <>
              <div className={styles.statsRow}>
                {[
                  {val:cycles[0]?`Day ${cyclePhase?.day??'?'}`:'—', label:'Cycle Phase',      color:'var(--rose)'},
                  {val:contacts.length,                              label:'Trusted Contacts',  color:'#50c878'},
                  {val:sosHistory.length,                            label:'SOS Alerts Sent',   color:'#f9a825'},
                  {val:posts.length,                                 label:'Forum Posts',        color:'var(--lavender)'},
                ].map(s=>(
                  <div key={s.label} className={styles.statCard}>
                    <div className={styles.statVal} style={{color:s.color}}>{s.val}</div>
                    <div className={styles.statLabel}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div className={styles.widgetRow}>
                <div className={styles.widget}>
                  <div className={styles.widgetTitle}>Emergency SOS</div>
                  <div className={styles.sosWrap}>
                    <button className={styles.sosMini} onClick={() => triggerSOS('manual')} disabled={sosSending}>
                      {sosSending ? '…' : 'SOS'}
                    </button>
                    <div className={styles.sosLabel}>Tap in emergency</div>
                  </div>
                </div>
                <div className={styles.widget}>
                  <div className={styles.widgetTitle}>Today's Mood</div>
                  <div className={styles.moodRow}>{MOODS.slice(0,4).map(m=><div key={m.id} className={styles.moodEmoji}>{m.emoji}</div>)}</div>
                  <div style={{fontSize:'0.78rem',color:'var(--text-light)',marginTop:6}}>{moods[0]?`Today: ${moods[0].moodEmoji} ${moods[0].mood}`:'Log mood in Health Hub'}</div>
                </div>
                <div className={`${styles.widget} ${styles.widgetFull}`}>
                  <div className={styles.widgetTitle}>Quick Navigation</div>
                  <div className={styles.quickGrid}>
                    {[['sos','🚨','Emergency SOS'],['health','🌸','Health Hub'],['ai','🤖','AI Assistant'],['map','🗺️','Safety Map']].map(([id,ic,label])=>(
                      <button key={id} className={styles.quickBtn} onClick={() => setTab(id)}>{ic} {label}</button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ══ SOS TAB — all safety features unified ══ */}
          {tab==='sos' && (
            <div className={styles.sosPage}>
              {/* Main SOS card */}
              <div className={styles.sosCard}>
                <div className={styles.sosTitle}>🚨 Emergency SOS</div>
                <textarea className={styles.sosMsg} placeholder="Optional message (e.g. 'Being followed near CP Metro')" value={customMsg} onChange={e=>setCustomMsg(e.target.value)} rows={2} />

                {/* BIG SOS BUTTON */}
                <button className={styles.sosBig} onClick={() => triggerSOS('manual')} disabled={sosSending}>
                  {sosSending ? '⏳ Sending SOS…' : '🚨 SEND SOS NOW'}
                </button>

                {/* Auto-active safety indicators — no buttons needed */}
                <div className={styles.autoActiveRow}>
                  <div className={`${styles.autoChip} ${voiceListening ? styles.chipOn : styles.chipStandby}`}>
                    🎙️ Voice SOS {voiceListening ? '— Listening' : '— Starting…'}
                    {voiceTranscript && <span className={styles.transcript}> · heard: "{voiceTranscript}"</span>}
                  </div>
                  <div className={`${styles.autoChip} ${shakeArmed ? styles.chipOn : styles.chipStandby}`}>
                    📳 Shake SOS {shakeArmed ? `— Armed ${shakeCount>0?`(${shakeCount}/5 shakes)`:''}` : '— Tap SOS button once to arm on iOS'}
                  </div>
                </div>

                {/* Fake call config */}
                <div className={styles.fakeCallConfig}>
                  <span className={styles.fakeLabel}>📞 Fake call triggered with SOS — caller name:</span>
                  <input className={styles.fakeInput} value={fakeCallerName} onChange={e=>setFakeCallerName(e.target.value)} placeholder="Mom, Friend…" />
                </div>

                {/* Check-in timer config */}
                <div className={styles.checkInConfig}>
                  <span className={styles.fakeLabel}>⏱️ Auto check-in after SOS every:</span>
                  <div className={styles.timerRow}>
                    <input type="range" min={5} max={60} step={5} value={walkMinutes} onChange={e=>setWalkMinutes(+e.target.value)} className={styles.slider} />
                    <span className={styles.timerVal}>{walkMinutes} min</span>
                  </div>
                </div>

                {/* Live location status */}
                {shareActive && liveCoords && (
                  <div className={styles.liveLocBox}>
                    <div>📍 <strong>Live location sharing ON</strong></div>
                    <div style={{fontSize:'0.77rem',color:'#555',margin:'3px 0'}}>
                      {liveCoords.lat.toFixed(5)}, {liveCoords.lng.toFixed(5)}
                    </div>
                    <div className={styles.liveLinkRow}>
                      <input className={styles.liveLink} value={shareLink} readOnly onClick={async()=>{await navigator.clipboard.writeText(shareLink); showToast('Location link copied!');}} />
                      <a href={shareLink} target="_blank" rel="noreferrer" className={styles.liveOpenBtn}>Open</a>
                    </div>
                    <button className={styles.stopLocBtn} onClick={stopLiveLocation}>Stop Sharing</button>
                  </div>
                )}

                {/* SOS result */}
                {sosResult && (
                  <div className={styles.sosResult}>
                    <div className={styles.sosResultTitle}>✅ SOS Sent in {sosResult.responseTime}ms</div>
                    {sosResult.alertsSent?.map((c,i)=>(
                      <div key={i} className={styles.sosContact}>
                        <span>{c.name}</span>
                        <span>{c.smsSent?'✅ SMS':'❌ SMS'} · {c.emailSent?'✅ Email':'❌ Email'}</span>
                      </div>
                    ))}
                    {sosResult.mapsLink && <a href={sosResult.mapsLink} target="_blank" rel="noreferrer" className={styles.mapsLink}>📍 View your location on Maps</a>}
                  </div>
                )}
              </div>

              {/* SOS History */}
              <div className={styles.sosHistory}>
                <div className={styles.sectionTitle}>Past SOS Alerts</div>
                {sosHistory.length===0 ? <div className={styles.empty}>No SOS alerts sent yet. Stay safe! 🌸</div> : sosHistory.map((s,i)=>(
                  <div key={i} className={styles.historyItem}>
                    <span>{new Date(s.createdAt).toLocaleDateString('en-IN')}</span>
                    <span style={{fontSize:'0.78rem'}}>{s.location?.address||'Location logged'}</span>
                    <span className={s.status==='sent'?styles.statusSent:styles.statusFailed}>{s.status}</span>
                    <span style={{fontSize:'0.72rem',color:'var(--text-light)'}}>{s.triggeredBy}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ HEALTH HUB ══ */}
          {tab==='health' && (
            <div className={styles.healthPage}>
              <div className={styles.healthGrid}>
                {/* Log Period */}
                <div className={styles.healthCard}>
                  <div className={styles.cardTitle}>🌸 Log Period</div>
                  <label className={styles.label}>Start Date</label>
                  <input type="date" className={styles.input} value={periodForm.periodStart} onChange={e=>setPeriodForm({...periodForm,periodStart:e.target.value})} />
                  <label className={styles.label}>End Date (optional)</label>
                  <input type="date" className={styles.input} value={periodForm.periodEnd} onChange={e=>setPeriodForm({...periodForm,periodEnd:e.target.value})} />
                  <label className={styles.label}>Cycle Length: {periodForm.cycleLength} days</label>
                  <input type="range" min={21} max={35} value={periodForm.cycleLength} onChange={e=>setPeriodForm({...periodForm,cycleLength:+e.target.value})} className={styles.slider} />
                  <button className={styles.btn} onClick={logPeriod}>Save Cycle Entry</button>
                </div>

                {/* Log Mood */}
                <div className={styles.healthCard}>
                  <div className={styles.cardTitle}>😊 Daily Mood Journal</div>
                  <div className={styles.moodGrid}>
                    {MOODS.map(m=>(
                      <button key={m.id} className={`${styles.moodBtn} ${selectedMood===m.id?styles.moodSelected:''}`} onClick={()=>setSelectedMood(m.id)}>
                        <span style={{fontSize:'1.5rem'}}>{m.emoji}</span>
                        <span style={{fontSize:'0.7rem'}}>{m.label}</span>
                      </button>
                    ))}
                  </div>
                  <label className={styles.label}>Energy Level: {energyLevel}/10</label>
                  <input type="range" min={1} max={10} value={energyLevel} onChange={e=>setEnergyLevel(+e.target.value)} className={styles.slider} />
                  <textarea className={styles.input} placeholder="Notes (optional)" value={moodNote} onChange={e=>setMoodNote(e.target.value)} rows={2} />
                  <button className={styles.btn} onClick={logMood}>Save Mood</button>
                </div>

                {/* Recent Cycles */}
                <div className={styles.healthCard}>
                  <div className={styles.cardTitle}>📅 Recent Cycles</div>
                  {cycles.length===0 ? <div className={styles.empty}>No cycles logged yet.</div> : cycles.map((c,i)=>(
                    <div key={i} className={styles.cycleItem}>
                      <span>🌸 {new Date(c.periodStart).toLocaleDateString('en-IN')}</span>
                      <span style={{color:'var(--lavender)'}}>Cycle: {c.cycleLength}d</span>
                      {c.nextPeriodDate && <span style={{color:'#888',fontSize:'0.78rem'}}>Next: {new Date(c.nextPeriodDate).toLocaleDateString('en-IN')}</span>}
                    </div>
                  ))}
                </div>


              </div>

              {/* Health Articles — real links */}
              <div style={{marginTop:20}}>
                <div className={styles.sectionTitle}>📚 Health Articles</div>
                <div className={styles.articleGrid}>
                  {HEALTH_ARTICLES.map(a=>(
                    <a key={a.title} href={a.url} target="_blank" rel="noreferrer" className={styles.articleCard}>
                      <div className={styles.articleIcon}>{a.icon}</div>
                      <div className={styles.articleTag}>{a.tag}</div>
                      <div className={styles.articleTitle}>{a.title}</div>
                      <div className={styles.articleSrc}>{a.src} →</div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ LEGAL INFO ══ */}
          {tab==='legal' && (
            <div className={styles.legalPage}>
              <div className={styles.sectionTitle}>⚖️ Know Your Rights</div>
              <div className={styles.legalGrid}>
                {[
                  {title:'POSH Act 2013',icon:'🏢',color:'#e8758a',desc:'Sexual harassment at workplace. ICC mandatory in all orgs 10+ employees. Complaints within 3 months.',section:'Sec 2,4,9,11',url:'https://en.wikipedia.org/wiki/Sexual_Harassment_of_Women_at_Workplace_(Prevention,_Prohibition_and_Redressal)_Act,_2013'},
                  {title:'POCSO Act 2012',icon:'🛡️',color:'#66bb6a',desc:'Protects children under 18 from sexual abuse. Mandatory reporting. Special courts. Penalty: 7 yrs to life.',section:'Sec 4,6,8,10',url:'https://en.wikipedia.org/wiki/Protection_of_Children_from_Sexual_Offences_Act,_2012'},
                  {title:'DV Act 2005',icon:'🏠',color:'#ab47bc',desc:'Covers physical, verbal, emotional, sexual, economic abuse. No police FIR needed for Protection Orders.',section:'Sec 12,17,18,20',url:'https://en.wikipedia.org/wiki/Protection_of_Women_from_Domestic_Violence_Act_2005'},
                  {title:'Dowry Prohibition',icon:'💍',color:'#f9a825',desc:'Giving or taking dowry is punishable. BNS Sec 84 cruelty by husband/in-laws — cognizable offence.',section:'BNS 84/IPC 498A',url:'https://en.wikipedia.org/wiki/Dowry_Prohibition_Act,_1961'},
                  {title:'Zero FIR Right',icon:'📋',color:'#29b6f6',desc:'File FIR at ANY police station regardless of jurisdiction. Police CANNOT refuse to register your FIR.',section:'CrPC 154/BNSS 173',url:'https://en.wikipedia.org/wiki/First_information_report#Zero_FIR'},
                  {title:'Sexual Assault Laws',icon:'⚖️',color:'#ef5350',desc:'Rape (BNS 63): 7 yrs–life. Molestation (BNS 74): 5 yrs. Stalking (BNS 78): 1–3 yrs.',section:'BNS 63,74,77,78',url:'https://en.wikipedia.org/wiki/Bharatiya_Nyaya_Sanhita'},
                ].map(law=>(
                  <div key={law.title} className={styles.legalCard} style={{borderTop:`3px solid ${law.color}`}}>
                    <div className={styles.legalIcon}>{law.icon}</div>
                    <div className={styles.legalTitle}>{law.title}</div>
                    <div className={styles.legalSection} style={{color:law.color}}>{law.section}</div>
                    <div className={styles.legalDesc}>{law.desc}</div>
                    <a href={law.url} target="_blank" rel="noreferrer" style={{fontSize:'0.75rem',color:law.color,fontWeight:700,textDecoration:'none',marginTop:'auto',display:'block'}}>📄 Read Full Law →</a>
                  </div>
                ))}
              </div>
              <div className={styles.helplineSection}>
                <div className={styles.sectionTitle}>📞 Emergency Helplines</div>
                <div className={styles.helplineGrid}>
                  {[
                    ['181','Mahila Helpline','24/7 Free','#e8758a','https://wcd.nic.in'],
                    ['100','Police','Emergency','#ef5350','https://bprd.nic.in'],
                    ['112','National Emergency','All Services 24/7','#f9a825','https://112.gov.in'],
                    ['7827170170','NCW Helpline','Women\'s Rights','#ab47bc','https://ncw.nic.in'],
                    ['1930','Cyber Crime','Online Harassment','#29b6f6','https://cybercrime.gov.in'],
                    ['9152987821','iCall','Mental Health','#66bb6a','https://icallhelpline.org'],
                  ].map(([num,name,desc,color,site])=>(
                    <div key={num} className={styles.helplineCard} style={{borderLeft:`4px solid ${color}`}}>
                      <a href={`tel:${num}`} style={{textDecoration:'none'}}><div className={styles.helplineNum} style={{color}}>📞 {num}</div><div className={styles.helplineName}>{name}</div><div className={styles.helplineDesc}>{desc}</div></a>
                      <a href={site} target="_blank" rel="noreferrer" style={{fontSize:'0.72rem',color,fontWeight:700,textDecoration:'none',marginTop:4,display:'block'}}>Visit Website →</a>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ══ AI ASSISTANT — single, all modules ══ */}
          {tab==='ai' && (
            <div className={styles.chatPage}>
              <div className={styles.chatHeader}>
                <div className={styles.chatAvatar}>🤖</div>
                <div>
                  <div className={styles.chatName}>HerGuardian AI Assistant</div>
                  <div className={styles.chatStatus}>Legal · Health · Safety · Emotional Support · Powered by Claude</div>
                </div>
              </div>
              <div className={styles.chatMessages}>
                {chatMessages.map((m,i)=>(
                  <div key={i} className={`${styles.chatBubble} ${m.role==='user'?styles.chatUser:styles.chatAssistant}`}>
                    {m.content.split('\n').map((line,j)=><p key={j} style={{margin:'2px 0'}}>{line}</p>)}
                  </div>
                ))}
                {chatLoading && <div className={`${styles.chatBubble} ${styles.chatAssistant}`}>🌸 Thinking…</div>}
                <div ref={chatEndRef} />
              </div>
              <div className={styles.chatInputRow}>
                <input className={styles.chatInput} placeholder="Ask anything — legal rights, health, safety tips, emotional support…" value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&sendChat()} />
                <button className={styles.chatSend} onClick={()=>sendChat()} disabled={chatLoading}>Send</button>
              </div>
              <div className={styles.chatQuickQ}>
                {['What is the POSH Act?','How do I file a DV case?','Foods to eat during period?','How to stay calm when anxious?','What is POCSO?','Healthy cycle length?'].map(q=>(
                  <button key={q} className={styles.quickQ} onClick={()=>sendChat(q)}>{q}</button>
                ))}
              </div>
              <div className={styles.disclaimer}>ℹ️ For awareness only. Not legal or medical advice. Consult a professional for your specific situation.</div>
            </div>
          )}

          {/* ══ FORUM + WELLNESS ══ */}
          {tab==='wellness' && (
            <div className={styles.forumPage}>
              {/* Wellness videos — real YouTube links */}
              <div className={styles.sectionTitle}>🎬 Wellness Videos</div>
              <div className={styles.videoGrid}>
                {WELLNESS_VIDEOS.map(v=>(
                  <a key={v.title} href={v.url} target="_blank" rel="noreferrer" className={styles.videoCard}>
                    <div className={styles.videoThumb}>{v.thumb}</div>
                    <div className={styles.videoMeta}>
                      <div className={styles.videoTitle}>{v.title}</div>
                      <div className={styles.videoChannel}>{v.channel} · {v.duration}</div>
                    </div>
                    <div className={styles.playIcon}>▶</div>
                  </a>
                ))}
              </div>

              {/* Breathing techniques with real links */}
              <div className={styles.sectionTitle} style={{marginTop:20}}>🧘‍♀️ Breathing & Grounding</div>
              <div className={styles.resourceGrid}>
                {[
                  {title:'4-7-8 Breathing Technique',desc:'Inhale 4s → Hold 7s → Exhale 8s. Instant anxiety relief.',icon:'🌬️',url:'https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/'},
                  {title:'5-4-3-2-1 Grounding',desc:'5 things you see, 4 hear, 3 touch, 2 smell, 1 taste.',icon:'🌿',url:'https://en.wikipedia.org/wiki/Grounding_(psychology)'},
                  {title:'Body Scan Meditation',desc:'YouTube search — guided progressive relaxation.',icon:'🧘‍♀️',url:'https://www.youtube.com/results?search_query=body+scan+meditation+guided'},
                  {title:'iCall Crisis Helpline',desc:'iCall: 9152987821 · Vandrevala: 1860-2662-345',icon:'📞',url:'https://icallhelpline.org'},
                ].map(r=>(
                  <a key={r.title} href={r.url} target="_blank" rel="noreferrer" className={styles.resourceCard} style={{textDecoration:'none',color:'inherit'}}>
                    <div style={{fontSize:'2rem'}}>{r.icon}</div>
                    <div className={styles.resourceTitle}>{r.title}</div>
                    <div className={styles.resourceDesc}>{r.desc}</div>
                    <div style={{fontSize:'0.72rem',color:'var(--rose)',fontWeight:700,marginTop:6}}>Open →</div>
                  </a>
                ))}
              </div>

              {/* Forum */}
              <div className={styles.forumHeader} style={{marginTop:24}}>
                <div className={styles.sectionTitle}>💬 Peer Support Forum</div>
                <button className={styles.btn} onClick={()=>setShowPostForm(!showPostForm)}>{showPostForm?'Cancel':'+ New Post'}</button>
              </div>
              {showPostForm && (
                <div className={styles.postForm}>
                  <input className={styles.input} placeholder="Post title" value={postForm.title} onChange={e=>setPostForm({...postForm,title:e.target.value})} />
                  <textarea className={styles.input} placeholder="Share your experience or ask for support…" value={postForm.content} onChange={e=>setPostForm({...postForm,content:e.target.value})} rows={4} />
                  <div className={styles.postMeta}>
                    <select className={styles.input} style={{width:'auto'}} value={postForm.tag} onChange={e=>setPostForm({...postForm,tag:e.target.value})}>
                      <option value="support">💜 Support</option>
                      <option value="legal">⚖️ Legal Help</option>
                      <option value="health">🌸 Health</option>
                      <option value="safety">🛡️ Safety</option>
                      <option value="general">💬 General</option>
                    </select>
                    <label className={styles.checkLabel}><input type="checkbox" checked={postForm.isAnonymous} onChange={e=>setPostForm({...postForm,isAnonymous:e.target.checked})} /> Post anonymously</label>
                  </div>
                  <button className={styles.btn} onClick={createPost}>Submit Post</button>
                </div>
              )}
              {posts.length===0 ? <div className={styles.empty}>No posts yet. Be the first! 💜</div> : posts.map((p,i)=>(
                <div key={i} className={styles.postCard}>
                  <div className={styles.postTop}><span className={styles.postTag}>{p.tag}</span><span className={styles.postAuthor}>{p.displayName||'Anonymous'}</span><span className={styles.postDate}>{new Date(p.createdAt).toLocaleDateString('en-IN')}</span></div>
                  <div className={styles.postTitle}>{p.title}</div>
                  <div className={styles.postContent}>{p.content}</div>
                  <div className={styles.postActions}>
                    <button className={styles.likeBtn} onClick={async()=>{await forumAPI.likePost(p._id);loadForum();}}>💜 {p.likes}</button>
                    <span style={{fontSize:'0.78rem',color:'var(--text-light)'}}>{p.replies?.length||0} replies</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ══ SAFETY MAP ══ */}
          {tab==='map' && (
            <div className={styles.mapPage}>
              <div className={styles.sectionTitle}>🗺️ Safety Map</div>
              {locationLoading ? (
                <div className={styles.mapLoadCard}><div className={styles.mapSpinner}>🔍</div><div>Detecting your location and computing safety scores…</div></div>
              ) : myLocation ? (
                <>
                  <div className={styles.locationCard}>
                    <div className={styles.locationTop}>
                      <div>
                        <div className={styles.locationName}>📍 {autoReport.address}</div>
                        <div className={styles.locationCoords}>{myLocation.lat.toFixed(5)}, {myLocation.lng.toFixed(5)}</div>
                      </div>
                      <a href={`https://maps.google.com/?q=${myLocation.lat},${myLocation.lng}`} target="_blank" rel="noreferrer" className={styles.openMapBtn}>Open in Maps →</a>
                    </div>
                    <div className={styles.scoresRow}>
                      <div className={styles.scoreCard} style={{borderColor:autoReport.safetyScore>=7?'#66bb6a':autoReport.safetyScore>=4?'#f9a825':'#ef5350'}}>
                        <div className={styles.scoreVal} style={{color:autoReport.safetyScore>=7?'#16a34a':autoReport.safetyScore>=4?'#d97706':'#dc2626'}}>{autoReport.safetyScore}/10</div>
                        <div className={styles.scoreLabel}>Safety Score</div>
                        <div className={styles.scoreNote}>{autoReport.safetyScore>=7?'Generally safe':'Exercise caution'}</div>
                      </div>
                      <div className={styles.scoreCard} style={{borderColor:autoReport.lightingScore>=7?'#66bb6a':autoReport.lightingScore>=4?'#f9a825':'#ef5350'}}>
                        <div className={styles.scoreVal} style={{color:autoReport.lightingScore>=7?'#16a34a':autoReport.lightingScore>=4?'#d97706':'#dc2626'}}>{autoReport.lightingScore}/10</div>
                        <div className={styles.scoreLabel}>Lighting Score</div>
                        <div className={styles.scoreNote}>{autoReport.lightingScore>=7?'Well lit':'Poor lighting'}</div>
                      </div>
                      <div className={styles.scoreCard}>
                        <div className={styles.scoreVal} style={{color:autoReport.crowdDensity==='high'?'#16a34a':autoReport.crowdDensity==='medium'?'#d97706':'#dc2626'}}>
                          {autoReport.crowdDensity==='high'?'🟢 High':autoReport.crowdDensity==='medium'?'🟡 Medium':'🔴 Low'}
                        </div>
                        <div className={styles.scoreLabel}>Crowd Density</div>
                        <div className={styles.scoreNote}>{autoReport.crowdDensity==='high'?'Busy area':'Quieter area'}</div>
                      </div>
                    </div>
                    <div className={styles.scoresBasis}>📊 Auto-computed from time of day ({new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}) + community reports</div>
                    <div className={styles.reportBtns}>
                      <button className={`${styles.btn} ${styles.btnGreen}`} onClick={()=>reportZone('safe')}>✅ Mark as Safe Zone</button>
                      <button className={`${styles.btn} ${styles.btnRed}`}   onClick={()=>reportZone('unsafe')}>⚠️ Mark as Unsafe Zone</button>
                    </div>
                  </div>
                  <div className={styles.nearbySection}>
                    <div className={styles.cardTitle}>👮‍♀️ Nearest Police Stations</div>
                    {nearbyPlaces.police.length===0 ? (
                      <div className={styles.nearbyItem} style={{borderLeft:'4px solid #ef5350'}}>
                        <div><div className={styles.nearbyName}>Local Police Station</div><div className={styles.nearbyDist}>Loading from OpenStreetMap…</div></div>
                        <div className={styles.nearbyActions}><a href="tel:100" className={styles.nearbyCall}>📞 100</a><a href={`https://maps.google.com/maps?q=police+station+near+${myLocation.lat},${myLocation.lng}`} target="_blank" rel="noreferrer" className={styles.nearbyDir}>🧭 Find</a></div>
                      </div>
                    ) : nearbyPlaces.police.map((p,i)=>(
                      <div key={i} className={styles.nearbyItem} style={{borderLeft:'4px solid #ef5350'}}>
                        <div><div className={styles.nearbyName}>{p.name}</div><div className={styles.nearbyDist}>{p.dist} km away</div></div>
                        <div className={styles.nearbyActions}><a href="tel:100" className={styles.nearbyCall}>📞 100</a><a href={p.mapsUrl} target="_blank" rel="noreferrer" className={styles.nearbyDir}>🧭 Directions</a></div>
                      </div>
                    ))}
                  </div>
                  <div className={styles.nearbySection}>
                    <div className={styles.cardTitle}>🏥 Nearest Hospitals & Clinics</div>
                    {nearbyPlaces.hospitals.length===0 ? (
                      <div className={styles.nearbyItem} style={{borderLeft:'4px solid #66bb6a'}}>
                        <div><div className={styles.nearbyName}>Nearest Hospital</div><div className={styles.nearbyDist}>Loading from OpenStreetMap…</div></div>
                        <div className={styles.nearbyActions}><a href="tel:112" className={styles.nearbyCall}>📞 112</a><a href={`https://maps.google.com/maps?q=hospital+near+${myLocation.lat},${myLocation.lng}`} target="_blank" rel="noreferrer" className={styles.nearbyDir}>🧭 Find</a></div>
                      </div>
                    ) : nearbyPlaces.hospitals.map((h,i)=>(
                      <div key={i} className={styles.nearbyItem} style={{borderLeft:'4px solid #66bb6a'}}>
                        <div><div className={styles.nearbyName}>{h.name}</div><div className={styles.nearbyDist}>{h.dist} km away</div></div>
                        <div className={styles.nearbyActions}><a href="tel:112" className={styles.nearbyCall}>📞 112</a><a href={h.mapsUrl} target="_blank" rel="noreferrer" className={styles.nearbyDir}>🧭 Directions</a></div>
                      </div>
                    ))}
                  </div>
                  {zones.length>0 && (
                    <div className={styles.zoneList}>
                      <div className={styles.cardTitle}>Community Safety Reports ({zones.length})</div>
                      {zones.map((z,i)=>(
                        <div key={i} className={styles.zoneItem} style={{borderLeft:`4px solid ${z.type==='safe'?'#66bb6a':'#ef5350'}`}}>
                          <span>{z.type==='safe'?'✅ Safe':'⚠️ Unsafe'}</span><span>{z.address||'Nearby'}</span><span>Safety: {z.safetyScore}/10</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.mapLoadCard}><button className={styles.btn} onClick={loadMapData}>📍 Detect My Location</button></div>
              )}
            </div>
          )}

          {/* ══ PROFILE ══ */}
          {tab==='profile' && (
            <div className={styles.profilePage}>
              <div className={styles.profileCard}>
                <div className={styles.profileAvatar}>{user?.name?.[0]}</div>
                <div className={styles.profileName}>{user?.name}</div>
                <div className={styles.profileEmail}>{user?.email} {user?.isEmailVerified?'✅':'⚠️ Unverified'}</div>
                <div className={styles.profilePhone}>{user?.phone}</div>
              </div>
              <div className={styles.contactsSection}>
                <div className={styles.cardTitle}>👥 Trusted Contacts (SOS Recipients)</div>
                <p style={{color:'var(--text-light)',fontSize:'0.83rem',margin:'0 0 12px'}}>Up to 5 people. They get SMS + email when you trigger SOS.</p>
                {contacts.map((c,i)=>(
                  <div key={i} className={styles.contactItem}>
                    <span>{c.name}</span><span>{c.phone}</span>
                    <span style={{fontSize:'0.78rem',color:'var(--text-light)'}}>{c.email}</span>
                    <button className={styles.removeBtn} onClick={()=>removeContact(i)}>✕</button>
                  </div>
                ))}
                {contacts.length<5 && (
                  <div className={styles.addContact}>
                    <input className={styles.input} placeholder="Name" value={newContact.name} onChange={e=>setNewContact({...newContact,name:e.target.value})} />
                    <input className={styles.input} placeholder="Phone (+91XXXXXXXXXX)" value={newContact.phone} onChange={e=>setNewContact({...newContact,phone:e.target.value})} />
                    <input className={styles.input} placeholder="Email" value={newContact.email} onChange={e=>setNewContact({...newContact,email:e.target.value})} />
                    <button className={styles.btn} onClick={addContact}>+ Add Contact</button>
                  </div>
                )}
                <button className={styles.btn} style={{marginTop:12}} onClick={saveContacts}>💾 Save All Contacts</button>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
