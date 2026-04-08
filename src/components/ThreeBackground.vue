<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import * as THREE from 'three'

const canvasRef = ref<HTMLCanvasElement | null>(null)
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let animationId: number
let particles: THREE.Points

onMounted(() => {
  if (!canvasRef.value) return

  // Scene setup
  scene = new THREE.Scene()
  // scene.background = new THREE.Color(0x000000) // Transparent for overlay

  // Camera setup
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.z = 50

  // Renderer setup
  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    alpha: true,
    antialias: true
  })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  // Particles
  const geometry = new THREE.BufferGeometry()
  const count = 2000
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)

  for (let i = 0; i < count * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 100
    colors[i] = Math.random()
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const material = new THREE.PointsMaterial({
    size: 0.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.8
  })

  particles = new THREE.Points(geometry, material)
  scene.add(particles)

  // Animation Loop
  const animate = () => {
    animationId = requestAnimationFrame(animate)
    
    if (particles) {
      particles.rotation.x += 0.0005
      particles.rotation.y += 0.0005
    }

    renderer.render(scene, camera)
  }

  animate()

  window.addEventListener('resize', handleResize)
})

const handleResize = () => {
  if (!camera || !renderer) return
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  cancelAnimationFrame(animationId)
  if (renderer) {
    renderer.dispose()
  }
})
</script>

<template>
  <canvas ref="canvasRef" class="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none opacity-60"></canvas>
</template>
