import WeatherWidget from '@/components/WeatherWidget';

const Index = () => {
  return (
    <div className="h-screen w-screen bg-gradient-to-b from-slate-950 to-slate-900 overflow-hidden">
      <WeatherWidget />
    </div>
  );
};

export default Index;
