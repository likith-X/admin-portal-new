# 3D Hero Section Integration

## ✅ Integration Complete!

A stunning 3D animated hero section has been successfully integrated into your Agent Herald admin app using React Three Fiber.

---

## 📁 Project Structure

The following shadcn-compatible structure has been created:

```
agent-herald-admin/
├── lib/
│   └── utils.ts                    # cn() utility for className merging
├── app/
│   ├── components/
│   │   ├── ui/                     # shadcn components directory
│   │   │   ├── button.tsx          # Button component (shadcn)
│   │   │   ├── badge.tsx           # Badge component (shadcn)
│   │   │   ├── hero-section.tsx    # 3D Scene component with React Three Fiber
│   │   │   └── demo.tsx            # Hero demo implementation
│   │   └── Navbar.tsx              # Updated with 3D Hero link
│   └── hero-demo/
│       └── page.tsx                # Demo page route
```

---

## 🎨 Components Created

### 1. **lib/utils.ts**
Utility function for merging Tailwind classes with class-variance-authority.

```tsx
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 2. **components/ui/button.tsx**
Shadcn Button component with variants (default, destructive, outline, secondary, ghost, link).

**Usage:**
```tsx
import { Button } from "@/app/components/ui/button"

<Button variant="default">Click me</Button>
<Button variant="outline" size="lg">Large</Button>
```

### 3. **components/ui/badge.tsx**
Shadcn Badge component for labels and tags.

**Usage:**
```tsx
import { Badge } from "@/app/components/ui/badge"

<Badge variant="secondary">New</Badge>
```

### 4. **components/ui/hero-section.tsx**
3D animated scene using React Three Fiber with 50 rotating iridescent boxes.

**Features:**
- Smooth continuous rotation animation
- Iridescent material with metallic finish
- Responsive 3D canvas
- Optimized performance

**Usage:**
```tsx
import { Scene } from "@/app/components/ui/hero-section"

<Scene />
```

### 5. **components/ui/demo.tsx**
Complete hero section implementation with:
- 3D background animation
- Feature cards with icons
- Call-to-action buttons
- Responsive design
- Glassmorphism effects

---

## 📦 Dependencies Installed

```json
{
  "three": "^0.x.x",                      // 3D graphics library
  "@react-three/fiber": "^8.x.x",         // React renderer for Three.js
  "@radix-ui/react-slot": "^1.x.x",       // Composition primitive for shadcn
  "class-variance-authority": "^0.x.x",    // CVA for variant styles
  "lucide-react": "^0.x.x",               // Icon library
  "clsx": "^2.x.x",                       // Conditional className builder
  "tailwind-merge": "^2.x.x",             // Tailwind class merger
  "@types/three": "^0.x.x"                // Three.js TypeScript types
}
```

---

## 🚀 How to Use

### View the Demo
1. Start your dev server:
   ```bash
   cd agent-herald-admin
   npm run dev
   ```

2. Visit the demo page:
   - **http://localhost:3000/hero-demo**
   - Or click "✨ 3D Hero" in the navbar

### Integrate into Existing Pages

**Option 1: Use the complete demo**
```tsx
import { DemoOne } from "@/app/components/ui/demo"

export default function MyPage() {
  return <DemoOne />
}
```

**Option 2: Use just the 3D scene**
```tsx
import { Scene } from "@/app/components/ui/hero-section"

export default function MyPage() {
  return (
    <div className="relative h-screen">
      <div className="absolute inset-0">
        <Scene />
      </div>
      <div className="relative z-10">
        {/* Your content here */}
      </div>
    </div>
  )
}
```

**Option 3: Customize the demo**
```tsx
import { Scene } from "@/app/components/ui/hero-section"
import { Button } from "@/app/components/ui/button"

export default function CustomHero() {
  return (
    <div className="relative min-h-screen bg-black text-white">
      <div className="absolute inset-0">
        <Scene />
      </div>
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="text-center space-y-6">
          <h1 className="text-6xl font-bold">Your Custom Title</h1>
          <Button>Get Started</Button>
        </div>
      </div>
    </div>
  )
}
```

---

## 🎯 Component Props & Customization

### Scene Component
The 3D scene can be customized by modifying `hero-section.tsx`:

**Adjust camera position:**
```tsx
const cameraPosition: [number, number, number] = [5, 5, 20] // [x, y, z]
```

**Change box count:**
```tsx
const boxes = Array.from({ length: 50 }, ...) // Change 50 to desired count
```

**Modify rotation speed:**
```tsx
groupRef.current.rotation.x += delta * 0.05 // Change 0.05 for speed
```

**Change material properties:**
```tsx
<meshPhysicalMaterial 
  color="#232323"        // Box color
  metalness={1}          // 0-1, how metallic
  roughness={0.3}        // 0-1, surface roughness
  iridescence={1}        // 0-1, rainbow effect
  // ... other properties
/>
```

---

## 📱 Responsive Behavior

The hero section is fully responsive:
- **Mobile:** Single column layout, smaller text
- **Tablet:** 2-3 column feature grid
- **Desktop:** 4 column feature grid, full 3D effect

---

## 🎨 Styling Guidelines

### Glassmorphism Effects
```tsx
className="backdrop-blur-sm bg-white/10 border border-white/20"
```

### Dark Theme Integration
The component uses:
- Black/dark backgrounds (`from-[#000] to-[#1A2428]`)
- White text with opacity variants
- Subtle borders (`border-white/10`)

### Tailwind Classes Used
- `min-h-svh` - Full viewport height
- `backdrop-blur-sm` - Glassmorphism blur
- `bg-gradient-to-br` - Gradient backgrounds
- Responsive prefixes: `md:`, `lg:`

---

## ⚡ Performance Considerations

1. **3D Rendering:** The Scene component uses WebGL, ensure:
   - Users have hardware acceleration enabled
   - Consider adding a fallback for low-end devices

2. **Optimization Tips:**
   - Reduce box count for mobile: use `useMediaQuery` hooks
   - Lower quality settings for slower devices
   - Consider lazy loading the 3D scene

---

## 🔧 Troubleshooting

### Common Issues

**1. "Cannot find module '@/lib/utils'"**
- Ensure `lib/utils.ts` exists
- Check `tsconfig.json` has path aliases configured

**2. Black screen in 3D canvas**
- Check lighting intensity (currently set to 15)
- Verify camera position is correct
- Check browser console for Three.js errors

**3. Poor performance**
- Reduce box count (line 75 in hero-section.tsx)
- Lower bevelSegments and curveSegments
- Disable shadows if needed

---

## 🎓 Learn More

- **React Three Fiber:** https://docs.pmnd.rs/react-three-fiber
- **Three.js:** https://threejs.org/docs/
- **shadcn/ui:** https://ui.shadcn.com/
- **Lucide Icons:** https://lucide.dev/

---

## ✨ Next Steps

Consider adding:
- [ ] Mouse interaction (orbit controls)
- [ ] Scroll-based animations
- [ ] Different 3D shapes or models
- [ ] Color themes switcher
- [ ] Performance monitoring
- [ ] Mobile fallback UI

---

**Status:** ✅ Fully Integrated & Ready to Use!
**Route:** http://localhost:3000/hero-demo
