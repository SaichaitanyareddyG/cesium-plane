import React, { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';

const CesiumContainer = () => {
  const containerRef = useRef(null);
  let viewer;
  let handler;
  let planeEntity;

  useEffect(() => {
    if (containerRef.current) {
      Cesium.Ion.defaultAccessToken = process.env.REACT_APP_CESIUM_ION_ACCESS_TOKEN;

      viewer = new Cesium.Viewer(containerRef.current, {
        navigationHelpButton: false,
        animation: true,
        timeline: true,
        skyAtmosphere: new Cesium.SkyAtmosphere(),
        requestRenderMode: true, // Avoid re-rendering every frame
        maximumRenderTimeChange: 0.1, // Set max render time (seconds)
      });

      const scene = viewer.scene;

      // Define coordinates for the flight path
      const delhi = Cesium.Cartesian3.fromDegrees(77.1025, 28.7041, 0);
      const midpoint = Cesium.Cartesian3.fromDegrees(77.3485, 20.8379, 100000); // Adjusted altitude
      const bengaluru = Cesium.Cartesian3.fromDegrees(77.5946, 12.9716, 0);

      // Function to create a cloud billboard at a position
      const createCloudBillboard = (position) => {
        console.log('Creating cloud billboard at position:', position);
        return viewer.entities.add({
          position: position,
          billboard: {
            image: `${process.env.PUBLIC_URL}/clouds.png`, // Path to cloud image
            width: 100,
            height: 100,
            color: Cesium.Color.WHITE.withAlpha(0.7),
          },
        });
      };

      // Define cloud positions along the flight path
      const cloudPositions = [
        Cesium.Cartesian3.fromDegrees(77.1025, 28.7041, 10000),
        Cesium.Cartesian3.fromDegrees(77.2, 27.0, 15000),
        Cesium.Cartesian3.fromDegrees(77.3, 25.0, 20000),
        Cesium.Cartesian3.fromDegrees(77.3485, 20.8379, 25000), // Midpoint
        Cesium.Cartesian3.fromDegrees(77.4, 18.0, 20000),
        Cesium.Cartesian3.fromDegrees(77.5, 15.0, 15000),
        Cesium.Cartesian3.fromDegrees(77.5946, 12.9716, 10000), // Bengaluru
      ];

      // Add cloud billboards at random positions
      const randomizeClouds = () => {
        const randomIndex = Math.floor(Math.random() * cloudPositions.length);
        createCloudBillboard(cloudPositions[randomIndex]);
      };

      // Randomly add clouds every few seconds
      const cloudInterval = setInterval(randomizeClouds, 5000); // Every 5 seconds

      // Configure fog with random changes
      const randomizeFog = () => {
        scene.fog.enabled = true;
        scene.fog.density = Math.random() * 0.005 + 0.001; // Random fog density between 0.001 and 0.006
        scene.fog.minimumBrightness = Math.random() * 0.5 + 0.5; // Random brightness between 0.5 and 1
      };

      // Randomly change fog every 10 seconds
      const fogInterval = setInterval(randomizeFog, 10000); // Every 10 seconds

      // Function to load the flight path
      const loadFlightPath = () => {
        return new Promise((resolve) => {
          viewer.entities.add({
            polyline: {
              positions: [delhi, midpoint, bengaluru],
              width: 4,
              material: new Cesium.PolylineGlowMaterialProperty({
                glowPower: 0.3,
                color: Cesium.Color.RED,
              }),
              arcType: Cesium.ArcType.GEODESIC,
              clampToGround: false,
            },
          });

          // SVG markers for Delhi and Bengaluru
          const redWithWhiteBorder = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="white"/><circle cx="50" cy="50" r="35" fill="red"/></svg>';
          const blueWithWhiteBorder = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="white"/><circle cx="50" cy="50" r="35" fill="blue"/></svg>';

          const delhiEntity = viewer.entities.add({
            position: delhi,
            billboard: {
              image: redWithWhiteBorder,
              width: 30,
              height: 30,
            },
          });

          const bengaluruEntity = viewer.entities.add({
            position: bengaluru,
            billboard: {
              image: blueWithWhiteBorder,
              width: 30,
              height: 30,
            },
          });

          handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
          handler.setInputAction((movement) => {
            const pickedObject = viewer.scene.pick(movement.endPosition);
            if (pickedObject && pickedObject.id === delhiEntity) {
              delhiEntity.billboard.width = 40;
              delhiEntity.billboard.height = 40;
              delhiEntity.billboard.image = blueWithWhiteBorder;
            } else if (pickedObject && pickedObject.id === bengaluruEntity) {
              bengaluruEntity.billboard.width = 40;
              bengaluruEntity.billboard.height = 40;
              bengaluruEntity.billboard.image = redWithWhiteBorder;
            } else {
              delhiEntity.billboard.width = 30;
              delhiEntity.billboard.height = 30;
              delhiEntity.billboard.image = redWithWhiteBorder;
              bengaluruEntity.billboard.width = 30;
              bengaluruEntity.billboard.height = 30;
              bengaluruEntity.billboard.image = blueWithWhiteBorder;
            }
          }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

          resolve();
        });
      };

      const loadModel = () => {
        return new Promise((resolve) => {
          const startTime = Cesium.JulianDate.now();
          const stopTime = Cesium.JulianDate.addSeconds(startTime, 3600, new Cesium.JulianDate());

          viewer.clock.startTime = startTime.clone();
          viewer.clock.stopTime = stopTime.clone();
          viewer.clock.currentTime = startTime.clone();
          viewer.clock.clockRange = Cesium.ClockRange.CLAMPED; // Prevent looping
          viewer.clock.multiplier = 0.1;

          const positionProperty = new Cesium.SampledPositionProperty();
          positionProperty.addSample(startTime, delhi);
          positionProperty.addSample(Cesium.JulianDate.addSeconds(startTime, 1800, new Cesium.JulianDate()), midpoint);
          positionProperty.addSample(stopTime, bengaluru);

          planeEntity = viewer.entities.add({
            position: positionProperty,
            orientation: new Cesium.VelocityOrientationProperty(positionProperty),
            model: {
              uri: `${process.env.PUBLIC_URL}/787.glb`,
              minimumPixelSize: 900,
              scale: 0.001,
              maximumScale: 500,
            },
            point: {
              pixelSize: 3,
              color: Cesium.Color.RED,
              outlineColor: Cesium.Color.RED,
              outlineWidth: 1.0,
            },
            viewFrom: new Cesium.Cartesian3(30, 10, 10),
          });
          const polylinePositions = [];

          // Create the polyline entity with an empty array for positions
          const polylineEntity = viewer.entities.add({
            polyline: {
              positions: new Cesium.CallbackProperty(() => polylinePositions, false),
              width: 4,
              material: new Cesium.PolylineGlowMaterialProperty({
                glowPower: 0.3,
                color: Cesium.Color.YELLOW,
              }),
              clampToGround: false,
            },
          });
       
          // Update the polyline positions as the plane moves
          viewer.clock.onTick.addEventListener(() => {
            const currentPosition = positionProperty.getValue(viewer.clock.currentTime);
            if (currentPosition) {
              polylinePositions.push(currentPosition); // Add the current position to the polyline positions array
            }
          });      

          resolve();
        });
      };

      loadFlightPath().then(() => {
        loadModel().then(() => {
          trackPlane();
          // Add event listener to stop the plane at the destination
          viewer.clock.onTick.addEventListener(() => {
            if (Cesium.JulianDate.equals(viewer.clock.currentTime, viewer.clock.stopTime)) {
              viewer.clock.shouldAnimate = false;
            }
          });
        });
      });

      return () => {
        clearInterval(cloudInterval); // Clear the cloud interval
        clearInterval(fogInterval); // Clear the fog interval
        if (viewer) {
          viewer.destroy();
        }
        if (handler) {
          handler.destroy();
        }
      };
    }
  }, []);

  const startFlight = () => {
    if (viewer && planeEntity) {
      viewer.trackedEntity = planeEntity;
      viewer.clock.shouldAnimate = true;
    }
  };

  const trackPlane = () => {
    if (viewer && planeEntity) {
      viewer.trackedEntity = planeEntity;
    }
  };

  return (
    <div className="cesium-container">
      <button onClick={startFlight} style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 1 }}>
        Start Flight
      </button>
      <button onClick={trackPlane} style={{ position: 'absolute', top: '40px', left: '10px', zIndex: 1 }}>
        Track Plane
      </button>
      <div ref={containerRef} style={{ width: '100%', height: '100vh' }} />
    </div>
  );
};

export default CesiumContainer;
