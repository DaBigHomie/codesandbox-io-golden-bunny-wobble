import React, { useRef, useState, Suspense, useMemo } from 'react'
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber'
import { proxy, useSnapshot } from 'valtio'
import { HexColorPicker } from 'react-colorful'
import { useGLTF, MeshWobbleMaterial, OrbitControls } from '@react-three/drei'
import { LineBasicMaterial, MeshStandardMaterial } from 'three'
import { useSpring, a } from 'react-spring/three'
import { RecoilRoot, useRecoilState, useRecoilValue, atom } from 'recoil'
import * as THREE from 'three'
import { Physics, useBox, usePlane, useSphere } from '@react-three/cannon'
import niceColors from 'nice-color-palettes'

const SHOOT_RANGE = 100
const SPHERE_VELOCITY = 0.03
const ENEMY_SPEED = 0.5
var totScore = 0
var bunnyWobble = false

const state = proxy({
  current: null,
  items: {
    golden: '#FFD700'
  },
  wobbleSpeed: 0
})

const spherePositionState = atom({
  key: 'spherePositions', // unique ID (with respect to other atoms/selectors)
  default: [] // default value (aka initial value)
})
const bunnyPositionState = atom({
  key: 'bunnyPosition', // unique ID (with respect to other atoms/selectors)
  default: [{ x: 0, y: 2, z: 0 }] // default value (aka initial value)
})
export const scoreState = atom({
  key: 'score', // unique ID (with respect to other atoms/selectors)
  default: 0 // default value (aka initial value)
})

function Bunny(props) {
  const group = useRef()
  const bunnies = useRecoilValue(bunnyPositionState)
  const snap = useSnapshot(state)
  const { nodes, materials } = useGLTF('bunny.glb')
  const [hovered, setHovered] = useState(null)
  const [active, setActive] = useState(false)
  const [score] = useRecoilState(scoreState)
  const properties = useSpring({
    color: hovered ? 'hotpink' : 'blue',
    wobbleSpeed: active ? 1.5 : 0.5
  })
  const [ref] = useBox(() => ({ mass: 0, position: [0, 2, 0], group, ...props }))

  useFrame(() => {
    // group.current.rotation.y += 0.001
    state.wobbleSpeed = totScore

    if (bunnyWobble === true) {
      state.wobbleSpeed -= 0.1
      bunnyWobble = false
    }
    /* if (totScore > 0.1) {
      state.wobbleSpeed -= 0.01
      console.log('totScore' + totScore)
      console.log('state.wobbleSpeed' + state.wobbleSpeed)
    }*/
  })

  return (
    <group
      ref={ref}
      {...props}
      dispose={null}
      onPointOver={(e) => {}}
      onPointerOut={(e) => {}}
      onPointerDown={(e) => {
        state.wobbleSpeed += totScore
        //  state.position = [0, 7, 5]
        console.log('click' + state.wobbleSpeed, 'active: ' + active)
        setActive(!active)
        console.log('totScore' + totScore)
      }}
      onPointerMissed={(e) => {}}>
      {bunnies.map((bunny) => (
        <mesh position={[bunny.x, bunny.y / 3, bunny.z - 2]} key={`${bunny.x}`}>
          <sphereBufferGeometry attach="geometry" args={[2, 8, 8]} />
          <meshStandardMaterial attach="material" color="white" wireframe />
        </mesh>
      ))}
      <group position={(0, 2, 0)}>
        <group rotation={[-Math.PI / 2, 0, 0]}>
          <a.mesh geometry={nodes.Jeff_Koons_Balloon_Rabbit.geometry}>
            <MeshWobbleMaterial
              attach="material"
              speed={state.wobbleSpeed}
              factor={0.6}
              roughness={0.5}
              metalness={1.0}
              color={'#FFD700'}
            />
          </a.mesh>
        </group>
      </group>
    </group>
  )
}
function Picker() {
  const snap = useSnapshot(state)
  return (
    <div style={{ display: snap.current ? 'block' : 'none' }}>
      <HexColorPicker className="picker" color={snap.items[snap.current]} onChange={(color) => (state.items[snap.current] = color)} />
      <h1>{snap.items[snap.current]}</h1>
    </div>
  )
}
function distance(p1, p2) {
  const a = p2.x - p1.x
  const b = p2.y - p1.y
  const c = p2.z - p1.z

  return Math.sqrt(a * a + b * b + c * c)
}

///shoot sphere

function ShootSphere(props) {
  const [sphere] = useSphere(() => ({ mass: 5, spheres, args: 5, props }))
  //const sphere = useRef()
  const [spheres, setSpheres] = useRecoilState(spherePositionState)
  const { viewport } = useThree()
  //const [ref] = useSphere(() => ({ mass: 10, spheres, args: 5, group }))

  useFrame(({ mouse }) => {
    const x = (mouse.x * viewport.width) / 2
    const y = (mouse.y * viewport.height) / 2
    sphere.current.position.set(x, y, 3)
  })

  return (
    <mesh
      ref={sphere}
      // position={[0, 0, -100]}
      onClick={() =>
        setSpheres(
          [
            ...spheres,
            {
              id: Math.random(), // This needs to be unique.. Random isn't perfect but it works. Could use a uuid here.
              x: -sphere.current.position.x,
              y: -sphere.current.position.y,
              z: 3,
              velocity: [0, 0]
            }
          ],
          console.log('laser fired'),
          console.log('refx : ' + sphere.current.position.x),
          console.log('refy : ' + sphere.current.position.y),
          console.log('refz : ' + sphere.current.position.z)
        )
      }>
      <planeBufferGeometry attach="geometry" args={[100, 100]} />
      <meshStandardMaterial attach="material" color="orange" emissive="#ff0860" visible={false} />
    </mesh>
  )
}

function SphereController(props) {
  const spheres = useRecoilValue(spherePositionState)
  const [ref] = useSphere(() => ({ mass: 1, args: 5, spheres }))
  return (
    <group>
      {spheres.map((sphere) => (
        <mesh ref={ref} position={[-sphere.x, -sphere.y, sphere.z]} key={`${sphere.id}`} castShadow>
          <sphereBufferGeometry attach="geometry" />
          <meshNormalMaterial attach="material" />
        </mesh>
      ))}
    </group>
  )
}
function Spheres() {
  const spheres = useRecoilValue(spherePositionState)
  return (
    <group>
      {spheres.map((sphere) => (
        <mesh position={[-sphere.x, -sphere.y, sphere.z]} key={`${sphere.id}`}>
          <boxBufferGeometry attach="geometry" args={[2, 2, 2]} />
          <meshStandardMaterial attach="material" emissive="white" wireframe />
        </mesh>
      ))}
    </group>
  )
}
///

function MoveSphere() {
  // viewport = canvas in 3d units (meters)
  const [spheres, setSpherePositions] = useRecoilState(spherePositionState)
  const [bunnies, setBunnies] = useRecoilState(bunnyPositionState)
  const [score, setScore] = useRecoilState(scoreState)

  useFrame(({ mouse }) => {
    setSpherePositions(
      spheres
        .map((sphere) => ({
          id: sphere.id,
          x: sphere.x,
          y: sphere.y,
          z: sphere.z - SPHERE_VELOCITY,
          velocity: sphere.velocity
        }))
        .filter((sphere) => sphere.z > -SHOOT_RANGE)
    )
    const hitBunnies = bunnies
      ? bunnies.map((bunny) => spheres.filter((sphere) => spheres.filter((sphere) => distance(sphere, bunny) < 3).length > 0).length > 0)
      : []

    if (hitBunnies.includes(true)) {
      setScore(score + hitBunnies.filter((hit) => hit).length)
      console.log('hit detected' + score)
      if (score < 300 && bunnyWobble === false) {
        totScore += 0.01
      } else {
        setScore(0)
        totScore = 0
        bunnyWobble = true
      }
    }
    //setBunnies(bunnies.map((bunny) => ({ x: bunny.x, y: bunny.y, z: bunny.z })).filter((bunny, idx) => !hitBunnies[idx] && bunny.z < 0))
  })
  return null
}
function Plane(props) {
  const [ref] = usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0], ...props }))
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeBufferGeometry attach="geometry" args={[1000, 1000]} />
      <meshPhysicalMaterial attach="material" color="white" />
    </mesh>
  )
}

function Cube(props) {
  const [ref] = useBox(() => ({ mass: 1, position: [15, 3, 15], rotation: [0.4, 0.2, 0.5], ...props }))
  return (
    <mesh receiveShadow castShadow ref={ref}>
      <boxBufferGeometry attach="geometry" />
      <meshLambertMaterial attach="material" color="hotpink" />
    </mesh>
  )
}
function Sphere(props) {
  const [ref, api] = useSphere(() => ({ mass: 1, position: [0, 3, 0], args: 1, ...props }))
  return (
    <mesh
      receiveShadow
      castShadow
      ref={ref}
      onClick={() => {
        api.velocity.set(0, 5, 0)
      }}>
      <sphereGeometry attach="geometry" />
      <meshNormalMaterial attach="material" wireframe />
    </mesh>
  )
}

function InstancedSpheres({ number = 100 }) {
  const map = useLoader(THREE.TextureLoader, '/gold.jpg')
  const [ref, api] = useSphere((index) => ({
    mass: 1,
    position: [Math.random() - 0.5, Math.random() - 0.5, -index * 2],
    args: 1
  }))
  const colors = useMemo(() => {
    const array = new Float32Array(number * 3)
    const color = new THREE.Color()
    for (let i = 0; i < number; i++)
      color
        .set(niceColors[17][Math.floor(Math.random() * 10)])
        .convertSRGBToLinear()
        .toArray(array, i * 3)
    return array
  }, [number])
  return (
    <instancedMesh
      ref={ref}
      onClick={() => {
        api.velocity.set(0, 5, 0)
      }}
      castShadow
      receiveShadow
      args={[null, null, number]}>
      <sphereBufferGeometry attach="geometry" args={[1, 16, 16]}>
        <instancedBufferAttribute attachObject={['attributes', 'color']} args={[colors, 3]} />
      </sphereBufferGeometry>
      <meshPhongMaterial
        attach="material"
        vertexColors={THREE.VertexColors}
        normalMap={map}
        normalScale={[1, 1]}
        normalMap-wrapS={THREE.RepeatWrapping}
        normalMap-wrapT={THREE.RepeatWrapping}
        normalMap-repeat={[10, 10]}
      />
    </instancedMesh>
  )
}

export default function App() {
  return (
    <>
      <h1>Golden!</h1>
      <Canvas
        style={{ background: 'pink' }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true
          gl.shadowMap.type = THREE.PCFSoftShadowMap
        }}>
        <ambientLight intensity={0.5} />
        <spotLight intensity={0.5} position={[0, 10, 0]} castShadow />
        <pointLight intensity={0.3} position={[0, 10, 10]} />
        <pointLight intensity={0.3} position={[0, -10, -10]} />
        <OrbitControls />

        <Physics gravity={[0, -5, 0]}>
          <RecoilRoot>
            <Plane />

            <Suspense fallback={null}>
              <RecoilRoot>
                <Bunny />
              </RecoilRoot>
            </Suspense>

            <ShootSphere />
            <SphereController />
            <MoveSphere />
            <Spheres />

            <Cube position={[-5, 5, 0]} />
            <Cube position={[15, 5, 0]} />
            <Cube position={[5, 0, 10]} />
            <Sphere position={[2, 3, 0]} />
            <Sphere position={[5, 2, -2]} />
            <Sphere position={[-5, 2, -5]} />
            <Sphere position={[10, 2, -7]} />
            <InstancedSpheres number={100} />
          </RecoilRoot>
        </Physics>
      </Canvas>
    </>
  )
}
