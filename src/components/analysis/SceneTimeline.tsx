import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Scene {
  id: string;
  title: string;
  timestamp: string;
  duration: string;
  violations: string[];
  severity: 'None' | 'Mild' | 'Moderate' | 'Severe';
  text: string;
}

interface SceneTimelineProps {
  scenes: Scene[];
  onSceneClick: (scene: Scene) => void;
}

export const SceneTimeline = ({ scenes, onSceneClick }: SceneTimelineProps) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'None':
        return 'bg-success';
      case 'Mild':
        return 'bg-warning';
      case 'Moderate':
        return 'bg-destructive/80';
      case 'Severe':
        return 'bg-destructive';
      default:
        return 'bg-muted';
    }
  };

  return (
    <Card className="glass-panel p-6">
      <h2 className="text-2xl font-bold mb-6">Временная шкала сценария</h2>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
        
        <div className="space-y-6">
          {scenes.map((scene, index) => (
            <div key={scene.id} className="relative flex gap-4">
              {/* Timeline dot */}
              <div className="relative flex-shrink-0">
                <div className={`w-12 h-12 rounded-full ${getSeverityColor(scene.severity)} flex items-center justify-center text-white font-bold z-10 relative`}>
                  {index + 1}
                </div>
              </div>
              
              {/* Scene content */}
              <div
                onClick={() => onSceneClick(scene)}
                className="flex-1 glass-panel p-4 rounded-lg cursor-pointer hover:bg-muted/50 transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{scene.title}</h3>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      {scene.timestamp}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {scene.duration}
                    </Badge>
                  </div>
                </div>
                
                {scene.violations.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {scene.violations.map((violation, idx) => (
                      <Badge key={idx} className="text-xs">
                        {violation}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {scene.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
