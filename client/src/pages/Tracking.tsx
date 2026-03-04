import { motion } from "framer-motion";
import { ArrowLeft, Navigation, MapPin, Truck, Phone, Box, Clock, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from "react";

// Fix Leaflet marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom icons
const truckIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/741/741407.png', // Placeholder truck
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

const destIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/447/447031.png', // Placeholder pin
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

export default function Tracking() {
  const [currentPosition, setCurrentPosition] = useState<[number, number]>([54.193122, 37.617348]); // Tula
  const startPosition: [number, number] = [55.7558, 37.6173]; // Moscow
  const endPosition: [number, number] = [45.0355, 38.9753]; // Krasnodar

  // Simulate movement
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPosition(prev => [prev[0] - 0.001, prev[1] + 0.0005]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
       {/* Map Layer */}
       <div className="absolute inset-0 z-0">
          <MapContainer 
            center={[52, 39]} 
            zoom={6} 
            scrollWheelZoom={true} 
            className="w-full h-full"
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            
            {/* Route Line */}
            <Polyline 
              positions={[startPosition, currentPosition, endPosition]} 
              color="#00b3f2" 
              weight={4} 
              opacity={0.7} 
              dashArray="10, 10" 
            />
            
            {/* Markers */}
            <Marker position={startPosition}>
               <Popup>Москва (Старт)</Popup>
            </Marker>
            
            <Marker position={currentPosition} icon={truckIcon}>
               <Popup>Текущая позиция (В пути)</Popup>
            </Marker>

            <Marker position={endPosition} icon={destIcon}>
               <Popup>Краснодар (Финиш)</Popup>
            </Marker>
          </MapContainer>
          
          {/* Overlay Gradients */}
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-[400]" />
       </div>

      <header className="relative z-10 flex items-center gap-4 p-4">
        <Link href="/requests">
          <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-black/60 transition-colors border border-white/10 shadow-lg">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
        </Link>
        <div className="flex-1 text-center pr-10">
           <div className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 shadow-lg">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
             <span className="text-white font-bold text-sm">GPS Active</span>
           </div>
        </div>
      </header>

      <div className="flex-1" />

      {/* Driver Card (Floating) */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="relative z-10 mx-4 mb-4"
      >
        <div className="bg-white/90 dark:bg-[#1A1F2C]/90 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-white/20 dark:border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden border-2 border-white dark:border-gray-700">
               <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Driver" className="w-full h-full object-cover" />
             </div>
             <div>
               <h3 className="font-bold text-sm">Иванов Иван</h3>
               <p className="text-xs text-muted-foreground">Volvo FH16 • А 777 АА</p>
               <div className="flex gap-1 mt-1">
                 <Box className="w-3 h-3 text-primary" />
                 <span className="text-[10px] font-medium">Стройматериалы, 20т</span>
               </div>
             </div>
           </div>
           <button className="w-10 h-10 rounded-full bg-[#00b3f2] flex items-center justify-center text-white shadow-lg hover:bg-[#009bd1] transition-colors">
             <Phone className="w-5 h-5" />
           </button>
        </div>
      </motion.div>

      {/* Bottom Sheet */}
      <motion.div 
        initial={{ y: "85%" }}
        whileHover={{ y: "0%" }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 400 }} // Allow dragging up
        className="relative z-20 bg-background rounded-t-[2.5rem] p-6 pb-24 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/5 cursor-grab active:cursor-grabbing"
      >
        <div className="w-12 h-1.5 bg-secondary rounded-full mx-auto mb-6" />

        <div className="grid grid-cols-2 gap-4 mb-6">
           <div className="bg-secondary/30 rounded-2xl p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                 <Clock className="w-4 h-4" />
                 <span className="text-xs font-bold uppercase">ETA</span>
              </div>
              <p className="text-xl font-black">12 Авг</p>
              <p className="text-xs text-green-500 font-bold">По графику</p>
           </div>
           <div className="bg-secondary/30 rounded-2xl p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                 <Navigation className="w-4 h-4" />
                 <span className="text-xs font-bold uppercase">Осталось</span>
              </div>
              <p className="text-xl font-black">450 км</p>
              <p className="text-xs text-muted-foreground">~ 6 часов</p>
           </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Маршрут</p>
            <h3 className="font-bold text-lg flex items-center gap-2">
              Москва <ArrowLeft className="w-4 h-4 rotate-180 text-muted-foreground" /> Краснодар
            </h3>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-6 relative pl-2">
           <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border" />

           {[
             { title: "Загрузка завершена", sub: "Склад Москва (Север)", time: "08:00, 08 Авг", icon: Box, active: true, done: true },
             { title: "Выезд на маршрут", sub: "М-4 Дон", time: "10:30, 08 Авг", icon: Truck, active: true, done: true },
             { title: "В пути", sub: "Прохождение Тулы", time: "Сейчас", icon: Navigation, active: true, done: false },
             { title: "Прибытие", sub: "Склад Краснодар", time: "~ 12 Авг", icon: MapPin, active: false, done: false },
           ].map((step, i) => (
             <div key={i} className={`flex gap-4 relative z-10 transition-opacity ${step.active ? 'opacity-100' : 'opacity-40'}`}>
               <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-1 border-2 ${
                 step.done ? 'bg-green-500 border-green-500' : 
                 step.active ? 'bg-background border-primary shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 
                 'bg-background border-muted-foreground'
               }`}>
                 {step.done && <ShieldCheck className="w-2.5 h-2.5 text-white" />}
                 {!step.done && step.active && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
               </div>
               <div className="flex-1 flex justify-between items-start">
                 <div>
                   <h4 className={`text-sm font-bold ${step.active ? 'text-primary' : 'text-foreground'}`}>{step.title}</h4>
                   <p className="text-xs text-muted-foreground">{step.sub}</p>
                 </div>
                 <span className="text-xs text-muted-foreground font-mono bg-secondary/50 px-2 py-0.5 rounded">{step.time}</span>
               </div>
             </div>
           ))}
        </div>
      </motion.div>
    </div>
  );
}
