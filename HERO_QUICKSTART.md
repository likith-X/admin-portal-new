# 🚀 Quick Start - 3D Hero Section

## View Your New 3D Hero Section

1. **Start the dev server:**
   ```bash
   cd agent-herald-admin
   npm run dev
   ```

2. **Visit the demo page:**
   - Open: **http://localhost:3000/hero-demo**
   - Or click **✨ 3D Hero** in the navbar

---

## ✅ What Was Installed

### New Dependencies (26 packages added)
```
✓ three                          - 3D graphics library
✓ @react-three/fiber             - React Three.js renderer
✓ @radix-ui/react-slot           - Radix UI primitive
✓ class-variance-authority       - CVA for variants
✓ lucide-react                   - Icon library
✓ clsx                           - ClassName utility
✓ tailwind-merge                 - Tailwind merger
✓ @types/three                   - TypeScript types
```

### New Project Structure
```
✓ lib/utils.ts                   - cn() utility function
✓ app/components/ui/             - shadcn components folder
  ├── button.tsx                 - Button component
  ├── badge.tsx                  - Badge component
  ├── hero-section.tsx           - 3D Scene component
  └── demo.tsx                   - Complete demo

✓ app/hero-demo/page.tsx         - Demo route
✓ Updated Navbar with 3D Hero link
```

---

## 🎯 Quick Usage Examples

### 1. Use the Complete Demo
```tsx
import { DemoOne } from "@/app/components/ui/demo"

export default function MyPage() {
  return <DemoOne />
}
```

### 2. Use Just the 3D Background
```tsx
import { Scene } from "@/app/components/ui/hero-section"

export default function MyPage() {
  return (
    <div className="relative h-screen bg-black">
      <div className="absolute inset-0">
        <Scene />
      </div>
      <div className="relative z-10 text-white p-8">
        <h1>Your content here</h1>
      </div>
    </div>
  )
}
```

### 3. Use shadcn Components
```tsx
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"

<Button variant="default">Click me</Button>
<Badge variant="secondary">New</Badge>
```

---

## 🎨 Customization

### Change 3D Scene Colors
Edit `app/components/ui/hero-section.tsx`:
```tsx
<meshPhysicalMaterial 
  color="#232323"      // Change box color
  iridescence={1}      // Rainbow effect (0-1)
  metalness={1}        // Metallic look (0-1)
/>
```

### Adjust Animation Speed
```tsx
groupRef.current.rotation.x += delta * 0.05  // Change 0.05
```

### Modify Box Count
```tsx
Array.from({ length: 50 }, ...)  // Change 50
```

---

## 📱 Features

- ✨ **3D animated background** with 50 iridescent boxes
- 🎨 **Glassmorphism UI** with backdrop blur effects  
- 📱 **Fully responsive** design
- ⚡ **Performance optimized** with React Three Fiber
- 🎯 **shadcn/ui compatible** components
- 🌈 **Iridescent materials** with metallic finish

---

## 📖 Full Documentation

See **3D_HERO_INTEGRATION.md** for complete documentation including:
- Component props and API
- Performance optimization tips
- Troubleshooting guide
- Advanced customization options

---

**Your 3D hero section is ready! 🎉**

Visit: http://localhost:3000/hero-demo
