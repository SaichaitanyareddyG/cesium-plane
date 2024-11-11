import React, { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import geoJsonData from './india_state_geo.json'; // Adjust the path as necessary

const CesiumMap = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    let viewer;

    if (containerRef.current) {
      Cesium.Ion.defaultAccessToken = process.env.REACT_APP_CESIUM_ION_ACCESS_TOKEN; // Replace with your actual token

      viewer = new Cesium.Viewer(containerRef.current, {
        navigationHelpButton: false,
        animation: false,
        timeline: false
      });

      for (let i = 0; i < geoJsonData.features.length; i++) {
        let data = geoJsonData.features[i].geometry.type === 'Polygon' ? geoJsonData.features[i].geometry.coordinates.flat() : geoJsonData.features[i].geometry.coordinates.flat().flat();
        const sample = {
          "type": "FeatureCollection",
          "features": [
            {
              ...geoJsonData.features[i],
              "geometry": {
                "type": "Polygon",
                "coordinates": [
                  data
                ]
              }
            }
          ]
        };

        const geoJsonDataSource = new Cesium.GeoJsonDataSource();

        geoJsonDataSource.load(sample, {
          stroke: Cesium.Color.RED,
          fill: Cesium.Color.TRANSPARENT,
          strokeWidth: 2,
          markerSymbol: '?'
        }).then(() => {
          viewer.dataSources.add(geoJsonDataSource);

          geoJsonDataSource.entities.values.forEach(entity => {
            entity.polygon.outline = true;
            entity.polygon.outlineColor = Cesium.Color.RED;
            entity.polygon.extrudedHeight = 0;
            entity.polygon.material = Cesium.Color.TRANSPARENT;
            entity.polygon.outlineWidth = 2;

            // Add mouse enter and leave events
            entity.mouseEnter = () => {
              entity.polygon.outlineColor = Cesium.Color.YELLOW;
              entity.polygon.outlineWidth = 10;
            };

            entity.mouseLeave = () => {
              entity.polygon.outlineColor = Cesium.Color.RED;
              entity.polygon.outlineWidth = 2;
            };
          });

          viewer.zoomTo(geoJsonDataSource);

          
        }).otherwise(error => {
          console.error(error);
        });
      }

      return () => {
        if (viewer) {
          viewer.destroy();
        }
      };
    }
  }, []);

  return (
    <div className="cesium-container">
      <div style={{ height: "95vh", margin: "5px" }} ref={containerRef} className="cesium-content"></div>
    </div>
  );
};

export default CesiumMap;