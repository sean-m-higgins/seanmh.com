import * as THREE from "three";

// A transparent light volume over the original SVG, not a replacement for it.
export function initLightwell(canvas: HTMLCanvasElement, host: HTMLElement) {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: "low-power",
    });
  } catch {
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  const scene = new THREE.Scene(),
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
  camera.position.z = 2;
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      time: { value: 0 },
      pointer: { value: new THREE.Vector2(0, 0) },
    },
    vertexShader:
      "varying vec2 uvPos; void main(){uvPos=uv; gl_Position=vec4(position,1.0);}",
    fragmentShader: `precision mediump float; varying vec2 uvPos; uniform float time; uniform vec2 pointer;
    void main(){ vec2 p=uvPos; float cx=.5+pointer.x*.009; float spread=.01+(1.-p.y)*.085;
    float beam=exp(-pow((p.x-cx)/spread,2.))*smoothstep(.08,.35,p.y)*(1.-smoothstep(.65,.77,p.y));
    float shimmer=.58+.16*sin(time*.5+p.y*12.); float glow=exp(-length((p-vec2(cx,.715))*vec2(21.,24.)));
    float flecks=pow(max(0.,sin(p.x*130.+sin(p.y*80.+time*.13))*sin(p.y*170.-time*.09)),36.);
    gl_FragColor=vec4(vec3(.94,.73,.36),min(.45,beam*shimmer*.2+glow*.27+flecks*beam*.22));}`,
  });
  const geometry = new THREE.PlaneGeometry(2, 2);
  scene.add(new THREE.Mesh(geometry, material));
  let frame = 0,
    visible = true,
    disposed = false,
    last = 0;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const desktop = matchMedia(
    "(min-width: 900px) and (hover: hover) and (pointer: fine)",
  );
  function render(t: number) {
    frame = 0;
    if (
      disposed ||
      !visible ||
      document.hidden ||
      motion.matches ||
      !desktop.matches
    )
      return;
    if (t - last > 32) {
      material.uniforms.time.value = t / 1000;
      renderer.render(scene, camera);
      last = t;
    }
    frame = requestAnimationFrame(render);
  }
  function schedule() {
    if (
      !frame &&
      !disposed &&
      visible &&
      !document.hidden &&
      !motion.matches &&
      desktop.matches
    )
      frame = requestAnimationFrame(render);
  }
  const resize = new ResizeObserver(() => {
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    schedule();
  });
  resize.observe(host);
  const io = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible) schedule();
    else {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  });
  io.observe(host);
  const visibility = () => {
    if (document.hidden || motion.matches || !desktop.matches) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else schedule();
  };
  const pointer = (e: PointerEvent) => {
    const b = host.getBoundingClientRect();
    material.uniforms.pointer.value.set(
      (e.clientX - b.left) / b.width - 0.5,
      (e.clientY - b.top) / b.height - 0.5,
    );
  };
  host.addEventListener("pointermove", pointer, { passive: true });
  document.addEventListener("visibilitychange", visibility);
  motion.addEventListener("change", visibility);
  desktop.addEventListener("change", visibility);
  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    resize.disconnect();
    io.disconnect();
    document.removeEventListener("visibilitychange", visibility);
    motion.removeEventListener("change", visibility);
    desktop.removeEventListener("change", visibility);
    host.removeEventListener("pointermove", pointer);
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    canvas.classList.remove("ready");
  }
  canvas.addEventListener("webglcontextlost", dispose, { once: true });
  addEventListener("pagehide", (e) => {
    if (!e.persisted) dispose();
  });
  canvas.classList.add("ready");
  schedule();
}
