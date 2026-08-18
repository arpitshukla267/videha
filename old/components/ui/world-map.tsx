"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import { feature } from "topojson-client";
import { geoMercator } from "d3-geo";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { FeatureCollection, Geometry } from "geojson";

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const WIDTH = 800;
const HEIGHT = 450;

const ORIGIN = { name: "India", coordinates: [82.5, 22.5] as [number, number] };

const DESTINATIONS: {
  name: string;
  coordinates: [number, number];
  labelOffset: [number, number];
}[] = [
  { name: "North America", coordinates: [-100, 40], labelOffset: [0, -12] },
  { name: "Europe", coordinates: [12, 50], labelOffset: [0, -12] },
  { name: "Middle East", coordinates: [50, 24], labelOffset: [0, 16] },
  { name: "Southeast Asia", coordinates: [105, 5], labelOffset: [0, 18] },
  { name: "East Asia", coordinates: [125, 36], labelOffset: [14, -8] },
  { name: "Australia", coordinates: [134, -26], labelOffset: [0, 18] },
];

type WorldMapProps = {
  compact?: boolean;
  interactive?: boolean;
};

export function WorldMap({
  compact = false,
  interactive = true,
}: WorldMapProps) {
  const [geographies, setGeographies] =
    useState<FeatureCollection<Geometry> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(GEO_URL)
      .then((res) => res.json())
      .then((topology: Topology) => {
        if (cancelled) return;
        const objectName = Object.keys(topology.objects)[0];
        const geo = feature(
          topology,
          topology.objects[objectName] as GeometryCollection,
        ) as unknown as FeatureCollection<Geometry>;
        setGeographies(geo);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const scale = compact ? 125 : 160;
  // shifted east so India/the route hub sits centered in frame, not left-heavy
  const center: [number, number] = [25, 25];

  const projection = useMemo(
    () =>
      geoMercator()
        .scale(scale)
        .center(center)
        .translate([WIDTH / 2, HEIGHT / 2]),
    [scale],
  );

  const originXY = projection(ORIGIN.coordinates)!;

  return (
    <div
      className="h-full w-full min-h-[360px]"
    //   style={{
    //     maskImage:
    //       "radial-gradient(circle at 50% 50%, black 0%, black 42%, rgba(0,0,0,0.9) 58%, rgba(0,0,0,0.45) 72%, transparent 100%)",
    //     WebkitMaskImage:
    //       "radial-gradient(circle at 50% 50%, black 0%, black 42%, rgba(0,0,0,0.9) 58%, rgba(0,0,0,0.45) 72%, transparent 100%)",
    //   }}
    >
      <ComposableMap
        width={WIDTH}
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        projection="geoMercator"
        projectionConfig={{ scale, center }}
        className="h-full w-full"
      >
        {geographies && (
          <Geographies geography={geographies}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#DCD5C4"
                  stroke="#AFA48A"
                  strokeWidth={0.6}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none", fill: "#CFC5AA" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>
        )}

        <g>
          {DESTINATIONS.map((dest) => {
            const [x2, y2] = projection(dest.coordinates)!;
            const [x1, y1] = originXY;
            const midX = (x1 + x2) / 2;
            const midY = Math.min(y1, y2) - Math.abs(x2 - x1) * 0.12 - 14;
            return (
              <path
                key={`line-${dest.name}`}
                d={`M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`}
                fill="none"
                stroke="#2F6B4F"
                strokeWidth={1.1}
                strokeDasharray="4 3"
                strokeLinecap="round"
                opacity={0.8}
              />
            );
          })}
        </g>

        {DESTINATIONS.map((dest) => {
          const [x, y] = projection(dest.coordinates)!;
          return (
            <g key={dest.name}>
              <Marker coordinates={dest.coordinates}>
                <circle
                  r={4.5}
                  fill="#C9722F"
                  stroke="#F4F1EA"
                  strokeWidth={1.5}
                />
              </Marker>
              <text
                x={x + dest.labelOffset[0]}
                y={y + dest.labelOffset[1]}
                textAnchor="middle"
                fontSize={9.5}
                fontWeight={600}
                letterSpacing="0.02em"
                fill="#3A3528"
              >
                {dest.name}
              </text>
            </g>
          );
        })}

        <Marker coordinates={ORIGIN.coordinates}>
          <circle r={6.5} fill="#2F6B4F" stroke="#F4F1EA" strokeWidth={2} />
        </Marker>
        <text
          x={originXY[0]}
          y={originXY[1] + 20}
          textAnchor="middle"
          fontSize={11}
          fontWeight={700}
          fill="#211E17"
        >
          India
        </text>
      </ComposableMap>
    </div>
  );
}
