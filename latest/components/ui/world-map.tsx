"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useInView } from "framer-motion";
// @ts-ignore
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
  // { name: "East Asia", coordinates: [125, 36], labelOffset: [14, -8] },
  { name: "Australia & Oceania", coordinates: [134, -26], labelOffset: [0, 18] },
];

type WorldMapProps = {
  compact?: boolean;
  interactive?: boolean;
};

// Simple dart/plane silhouette. begin is "indefinite" here — it will
// NOT auto-play on mount. We trigger it manually via ref.beginElement()
// once the map is actually in the viewport (see WorldMap's useEffect below).
function PlaneMarker({
  pathD,
  onMotionRef,
  onFadeRef,
}: {
  pathD: string;
  onMotionRef: (el: SVGAnimateMotionElement | null) => void;
  onFadeRef: (el: SVGAnimateElement | null) => void;
}) {
  return (
    <g opacity={0}>
      <g>
        {/* Airplane */}
        <path
          d="
            M 10 0
            L 2 -2
            L -5 -7
            L -7 -6
            L -3 -1.5
            L -11 -2.5
            L -13 -1
            L -4 0
            L -13 1
            L -11 2.5
            L -3 1.5
            L -7 6
            L -5 7
            L 2 2
            Z
          "
          fill="#0B2638"
        />

        <animateMotion
          ref={onMotionRef}
          dur="3.5s"
          begin="indefinite"
          fill="freeze"
          rotate="auto"
          path={pathD}
        />
      </g>

      {/* Fade */}
      <animate
        ref={onFadeRef}
        attributeName="opacity"
        values="0;1;1;0"
        keyTimes="0;0.08;0.85;1"
        dur="3.5s"
        begin="indefinite"
        fill="freeze"
      />
    </g>
  );
}

export function WorldMap({
  compact = false,
  interactive = true,
}: WorldMapProps) {
  const [geographies, setGeographies] =
    useState<FeatureCollection<Geometry> | null>(null);

  const [isDesktop, setIsDesktop] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.3 });

  // Refs to each plane's SMIL animation elements, so we can start them
  // manually with JS-controlled timing instead of relying on `begin="Xs"`
  // offsets (which fire immediately when the element mounts late).
  const motionRefs = useRef<(SVGAnimateMotionElement | null)[]>([]);
  const fadeRefs = useRef<(SVGAnimateElement | null)[]>([]);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

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

  const WIDTH = isDesktop ? 800 : 600;
  const center: [number, number] = isDesktop ? [25, 25] : [15, 25];
  const scale = compact ? 125 : 160;

  const projection = useMemo(
    () =>
      geoMercator()
        .scale(scale)
        .center(center)
        .translate([WIDTH / 2, HEIGHT / 2]),
    [scale, center, WIDTH],
  );

  const originXY = projection(ORIGIN.coordinates)!;

  // Precompute each route's path string once, reused for the dashed line AND the plane motion path
  const routes = useMemo(() => {
    return DESTINATIONS.map((dest) => {
      const [x2, y2] = projection(dest.coordinates)!;
      const [x1, y1] = originXY;
      const midX = (x1 + x2) / 2;
      const midY = Math.min(y1, y2) - Math.abs(x2 - x1) * 0.12 - 14;
      return {
        ...dest,
        d: `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`,
      };
    });
  }, [projection, originXY]);

  // Trigger the plane flights only once the section is in view,
  // with a 1s pause first, then a stagger between each plane.
  useEffect(() => {
    if (!isInView) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    const startDelay = setTimeout(() => {
      routes.forEach((_, idx) => {
        const stagger = idx * 350; // ms between each plane departing
        const t = setTimeout(() => {
          motionRefs.current[idx]?.beginElement();
          fadeRefs.current[idx]?.beginElement();
        }, stagger);
        timers.push(t);
      });
    }, 500); // <-- 1 second delay after the map enters the viewport

    timers.push(startDelay);

    return () => timers.forEach(clearTimeout);
  }, [isInView, routes]);

  return (
    <div ref={containerRef} className="h-full w-full min-h-[360px]">
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
            {({ geographies }: { geographies: any[] }) =>
              geographies.map((geo: any) => (
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

        {/* Dashed route lines — dashes flow continuously once the section is in view */}
        <g>
          {routes.map((route) => (
            <path
              key={`line-${route.name}`}
              d={route.d}
              fill="none"
              stroke="#2F6B4F"
              strokeWidth={1.1}
              strokeDasharray="4 3"
              strokeLinecap="round"
              opacity={0.8}
              suppressHydrationWarning
            >
              {isInView && (
                <animate
                  attributeName="stroke-dashoffset"
                  from="14"
                  to="0"
                  dur="1s"
                  repeatCount="indefinite"
                />
              )}
            </path>
          ))}
        </g>

        {/* Planes — fly from India to each destination once the section enters viewport */}
        {isInView && (
          <g>
            {routes.map((route, idx) => (
              <PlaneMarker
                key={`plane-${route.name}`}
                pathD={route.d}
                onMotionRef={(el) => {
                  motionRefs.current[idx] = el;
                }}
                onFadeRef={(el) => {
                  fadeRefs.current[idx] = el;
                }}
              />
            ))}
          </g>
        )}

        {routes.map((dest) => {
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
