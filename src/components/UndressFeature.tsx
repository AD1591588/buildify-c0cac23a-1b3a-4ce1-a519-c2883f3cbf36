
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface UndressFeatureProps {
  productId: string;
  modelUrl: string;
  undressOptions: {
    layers: string[];
    preview_url?: string;
  };
  onLayerChange: (layers: string[], opacity: number) => void;
}

const UndressFeature: React.FC<UndressFeatureProps> = ({
  productId,
  modelUrl,
  undressOptions,
  onLayerChange,
}) => {
  const [activeLayer, setActiveLayer] = useState<string>(undressOptions.layers[0] || 'outer');
  const [layerOpacity, setLayerOpacity] = useState<number>(100);
  const [showUndressPreview, setShowUndressPreview] = useState<boolean>(false);
  const [enabledLayers, setEnabledLayers] = useState<string[]>(undressOptions.layers || []);

  const handleLayerToggle = (layer: string, enabled: boolean) => {
    let newLayers = [...enabledLayers];
    
    if (enabled) {
      if (!newLayers.includes(layer)) {
        newLayers.push(layer);
      }
    } else {
      newLayers = newLayers.filter(l => l !== layer);
    }
    
    setEnabledLayers(newLayers);
    onLayerChange(newLayers, layerOpacity / 100);
  };

  const handleOpacityChange = (value: number[]) => {
    const opacity = value[0];
    setLayerOpacity(opacity);
    onLayerChange(enabledLayers, opacity / 100);
  };

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Undress Feature</h3>
          <div className="flex items-center space-x-2">
            <Switch
              id="undress-preview"
              checked={showUndressPreview}
              onCheckedChange={setShowUndressPreview}
            />
            <Label htmlFor="undress-preview">Preview</Label>
          </div>
        </div>

        {showUndressPreview && undressOptions.preview_url && (
          <div className="mb-4">
            <div className="aspect-square overflow-hidden rounded-md bg-gray-100">
              <img
                src={undressOptions.preview_url}
                alt="Undress Preview"
                className="w-full h-full object-cover"
                style={{ opacity: layerOpacity / 100 }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2 text-center">
              Preview image (for demonstration purposes)
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Clothing Layers</h4>
            <div className="flex flex-col space-y-2">
              {undressOptions.layers.map(layer => (
                <div key={layer} className="flex items-center space-x-2">
                  <Switch
                    id={`layer-${layer}`}
                    checked={enabledLayers.includes(layer)}
                    onCheckedChange={(checked) => handleLayerToggle(layer, checked)}
                  />
                  <Label htmlFor={`layer-${layer}`} className="capitalize">
                    {layer} Layer
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Layer Opacity: {layerOpacity}%</h4>
            <Slider
              value={[layerOpacity]}
              min={0}
              max={100}
              step={1}
              onValueChange={handleOpacityChange}
            />
          </div>

          <div className="pt-2">
            <p className="text-sm text-gray-500">
              Adjust the layers and opacity to see how the garment would look on different body types.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UndressFeature;