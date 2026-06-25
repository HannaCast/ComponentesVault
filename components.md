# Infinity Vault — Especificaciones de Componentes Reutilizables

> Documento de referencia para todos los componentes compartidos del sistema. Todos los componentes usan tokens CSS (`var(--vault-*)`, `bg-card`, etc.) y soportan modo claro/oscuro globalmente.

---

## Índice

1. [Primitivas de UI](#1-primitivas-de-ui)
   - [Button](#11-button)
   - [Input](#12-input)
   - [Textarea](#13-textarea)
   - [Label](#14-label)
   - [Badge](#15-badge)
   - [Avatar](#16-avatar)
   - [Separator](#17-separator)
   - [Skeleton](#18-skeleton)
   - [Progress](#19-progress)
   - [Slider](#110-slider)
   - [Toggle / ToggleGroup](#111-toggle--togglegroup)
2. [Formularios](#2-formularios)
   - [Checkbox](#21-checkbox)
   - [Switch](#22-switch)
   - [RadioGroup](#23-radiogroup)
   - [Select](#24-select)
   - [Form (RHF)](#25-form-react-hook-form)
3. [Contenedores y Tarjetas](#3-contenedores-y-tarjetas)
   - [Card](#31-card)
   - [Alert](#32-alert)
   - [ScrollArea](#33-scrollarea)
   - [Collapsible](#34-collapsible)
   - [Accordion](#35-accordion)
   - [Tabs](#36-tabs)
4. [Superposiciones y Diálogos](#4-superposiciones-y-diálogos)
   - [Modal](#41-modal)
   - [Dialog](#42-dialog)
   - [AlertDialog](#43-alertdialog)
   - [Sheet](#44-sheet)
   - [Drawer](#45-drawer)
   - [Popover](#46-popover)
   - [HoverCard](#47-hovercard)
   - [Tooltip](#48-tooltip)
5. [Navegación y Listas](#5-navegación-y-listas)
   - [DropdownMenu](#51-dropdownmenu)
   - [Breadcrumb](#52-breadcrumb)
   - [Pagination](#53-pagination)
   - [Table](#54-table)
   - [Command](#55-command)
6. [Componentes de Aplicación](#6-componentes-de-aplicación)
   - [Logo](#61-logo)
   - [Navbar](#62-navbar)
   - [Sidebar](#63-sidebar)
   - [NewFileMenu](#64-newfilemenu)
   - [ImageWithFallback](#65-imagewithfallback)
7. [Utilidades](#7-utilidades)
   - [cn()](#71-cn)
   - [useIsMobile](#72-useismobile)
   - [VisuallyHidden](#73-visuallyhidden)

---

## 1. Primitivas de UI

### 1.1 Button

**Archivo:** `src/app/components/ui/button.tsx`  
**Exportaciones:** `Button`, `buttonVariants`

#### Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'gradient' \| 'destructive' \| 'outline' \| 'ghost' \| 'link'` | `'default'` | Estilo visual del botón |
| `size` | `'default' \| 'sm' \| 'md' \| 'lg' \| 'icon'` | `'default'` | Tamaño del botón |
| `asChild` | `boolean` | `false` | Delega el render al hijo (Radix Slot) |
| `className` | `string` | — | Clases adicionales de Tailwind |
| `disabled` | `boolean` | `false` | Estado deshabilitado |

#### Variantes de estilo

| Variante | Uso recomendado |
|----------|-----------------|
| `default` | Acciones secundarias neutras |
| `primary` | Acción principal con color `--vault-blue` |
| `secondary` | Acción alternativa con fondo `bg-secondary` |
| `gradient` | CTA destacado (gradiente azul→cyan) |
| `destructive` | Acciones irreversibles (eliminar, etc.) |
| `outline` | Botón con borde, fondo transparente |
| `ghost` | Sin borde ni fondo (hover sutil) |
| `link` | Apariencia de enlace subrayado |

#### Variantes de tamaño

| Tamaño | Alto | Padding | Uso |
|--------|------|---------|-----|
| `sm` | h-8 | px-3 | Acciones en tablas / listas |
| `default` | h-9 | px-4 | Estándar |
| `md` | h-10 | px-6 | Formularios |
| `lg` | h-11 | px-8 | CTA principales |
| `icon` | h-9 w-9 | — | Botones de sólo icono |

#### Ejemplo de uso

```tsx
import { Button } from "@/components/ui/button";

// Acción primaria
<Button variant="primary" size="lg">Subir archivo</Button>

// Solo icono
<Button variant="ghost" size="icon">
  <MoreVertical className="size-4" />
</Button>

// Como enlace (asChild)
<Button asChild variant="link">
  <a href="/settings">Configuración</a>
</Button>
```

---

### 1.2 Input

**Archivo:** `src/app/components/ui/input.tsx`  
**Exportaciones:** `Input`

#### Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `type` | `string` | `'text'` | Tipo HTML del input |
| `className` | `string` | — | Clases adicionales |
| `...rest` | `InputHTMLAttributes` | — | Todos los atributos nativos del input |

#### Características

- Borde con `border-input`, fondo `bg-input/30`
- Focus ring con glow: `focus-visible:ring-[3px] focus-visible:ring-ring/50`
- Placeholder con `placeholder:text-muted-foreground`
- Soporte para `type="file"` con estilos propios
- Color de selección personalizado vía CSS variable

#### Ejemplo de uso

```tsx
import { Input } from "@/components/ui/input";

<Input type="email" placeholder="usuario@ejemplo.com" />
<Input type="file" accept=".pdf,.docx" />
<Input type="search" value={query} onChange={e => setQuery(e.target.value)} />
```

---

### 1.3 Textarea

**Archivo:** `src/app/components/ui/textarea.tsx`  
**Exportaciones:** `Textarea`

#### Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `className` | `string` | — | Clases adicionales |
| `...rest` | `TextareaHTMLAttributes` | — | Atributos nativos del textarea |

#### Características

- `field-sizing-content`: crece automáticamente con el contenido
- `min-h-16`, `resize-none`
- Focus ring idéntico al `Input`

#### Ejemplo de uso

```tsx
import { Textarea } from "@/components/ui/textarea";

<Textarea placeholder="Descripción del archivo..." rows={4} />
```

---

### 1.4 Label

**Archivo:** `src/app/components/ui/label.tsx`  
**Exportaciones:** `Label`

#### Props

| Prop | Tipo | Descripción |
|------|------|-------------|
| `className` | `string` | Clases adicionales |
| `...rest` | `Radix Label props` | Todos los atributos Radix Label |

#### Características

- `flex items-center gap-2` para alinear íconos junto al texto
- Opacidad reducida cuando el control asociado está deshabilitado (`peer-disabled:opacity-50`)

#### Ejemplo de uso

```tsx
import { Label } from "@/components/ui/label";

<Label htmlFor="email">Correo electrónico</Label>
<Input id="email" type="email" />
```

---

### 1.5 Badge

**Archivo:** `src/app/components/ui/badge.tsx`  
**Exportaciones:** `Badge`, `badgeVariants`

#### Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `variant` | `'default' \| 'secondary' \| 'destructive' \| 'outline'` | `'default'` | Estilo visual |
| `asChild` | `boolean` | `false` | Delega render al hijo |
| `className` | `string` | — | Clases adicionales |

#### Variantes

| Variante | Uso recomendado |
|----------|-----------------|
| `default` | Estado activo / etiqueta primaria |
| `secondary` | Categorías / metadatos neutrales |
| `destructive` | Errores, advertencias críticas |
| `outline` | Etiquetas sin relleno |

#### Ejemplo de uso

```tsx
import { Badge } from "@/components/ui/badge";

<Badge variant="default">Admin</Badge>
<Badge variant="secondary">PDF</Badge>
<Badge variant="destructive">Eliminado</Badge>
<Badge variant="outline">Compartido</Badge>
```

---

### 1.6 Avatar

**Archivo:** `src/app/components/ui/avatar.tsx`  
**Exportaciones:** `Avatar`, `AvatarImage`, `AvatarFallback`

#### Props

| Componente | Props principales | Descripción |
|------------|-----------------|-------------|
| `Avatar` | `className` | Contenedor raíz (10×10 por defecto) |
| `AvatarImage` | `src`, `alt`, `className` | Imagen del avatar |
| `AvatarFallback` | `className` | Texto/iniciales cuando no hay imagen |

#### Ejemplo de uso

```tsx
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

<Avatar>
  <AvatarImage src={user.photoUrl} alt={user.name} />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

---

### 1.7 Separator

**Archivo:** `src/app/components/ui/separator.tsx`  
**Exportaciones:** `Separator`

#### Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Dirección del separador |
| `decorative` | `boolean` | `true` | Si es puramente decorativo (accesibilidad) |
| `className` | `string` | — | Clases adicionales |

#### Ejemplo de uso

```tsx
import { Separator } from "@/components/ui/separator";

<Separator />                          {/* horizontal */}
<Separator orientation="vertical" />  {/* vertical */}
```

---

### 1.8 Skeleton

**Archivo:** `src/app/components/ui/skeleton.tsx`  
**Exportaciones:** `Skeleton`

#### Props

| Prop | Tipo | Descripción |
|------|------|-------------|
| `className` | `string` | Dimensiones y forma (obligatorio definir w/h) |

#### Características

- Animación `animate-pulse`
- Color `bg-accent`
- Sirve como placeholder durante estados de carga

#### Ejemplo de uso

```tsx
import { Skeleton } from "@/components/ui/skeleton";

{/* Cargando una tarjeta */}
<div className="space-y-2">
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
  <Skeleton className="h-32 w-full rounded-lg" />
</div>
```

---

### 1.9 Progress

**Archivo:** `src/app/components/ui/progress.tsx`  
**Exportaciones:** `Progress`

#### Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `value` | `number` | `0` | Porcentaje (0–100) |
| `className` | `string` | — | Clases adicionales |

#### Características

- Indicador de color primario con transición suave
- Borde redondeado completo

#### Ejemplo de uso

```tsx
import { Progress } from "@/components/ui/progress";

{/* Uso de almacenamiento */}
<Progress value={usedPercentage} className="h-2" />
```

---

### 1.10 Slider

**Archivo:** `src/app/components/ui/slider.tsx`  
**Exportaciones:** `Slider`

#### Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `value` | `number[]` | — | Valor(es) controlado(s) |
| `defaultValue` | `number[]` | `[0]` | Valor inicial no controlado |
| `min` | `number` | `0` | Valor mínimo |
| `max` | `number` | `100` | Valor máximo |
| `step` | `number` | `1` | Incremento |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Dirección |

#### Ejemplo de uso

```tsx
import { Slider } from "@/components/ui/slider";

<Slider
  defaultValue={[50]}
  min={0}
  max={100}
  step={5}
  onValueChange={([val]) => setVolume(val)}
/>
```

---

### 1.11 Toggle / ToggleGroup

**Archivos:**  
- `src/app/components/ui/toggle.tsx`  
- `src/app/components/ui/toggle-group.tsx`

#### Toggle — Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `variant` | `'default' \| 'outline'` | `'default'` | Estilo visual |
| `size` | `'default' \| 'sm' \| 'lg'` | `'default'` | Tamaño |
| `pressed` | `boolean` | — | Estado activo controlado |

#### ToggleGroup — Props

| Prop | Tipo | Descripción |
|------|------|-------------|
| `type` | `'single' \| 'multiple'` | Modo de selección |
| `variant` | igual que Toggle | Propagado a todos los items |
| `size` | igual que Toggle | Propagado a todos los items |
| `value` | `string \| string[]` | Valor(es) seleccionado(s) |

#### Ejemplo de uso

```tsx
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Grid, List } from "lucide-react";

<ToggleGroup type="single" value={viewMode} onValueChange={setViewMode}>
  <ToggleGroupItem value="grid"><Grid className="size-4" /></ToggleGroupItem>
  <ToggleGroupItem value="list"><List className="size-4" /></ToggleGroupItem>
</ToggleGroup>
```

---

## 2. Formularios

### 2.1 Checkbox

**Archivo:** `src/app/components/ui/checkbox.tsx`  
**Exportaciones:** `Checkbox`

#### Props

| Prop | Tipo | Descripción |
|------|------|-------------|
| `checked` | `boolean \| 'indeterminate'` | Estado del checkbox |
| `onCheckedChange` | `(checked: boolean) => void` | Callback de cambio |
| `disabled` | `boolean` | Estado deshabilitado |
| `className` | `string` | Clases adicionales |

#### Ejemplo de uso

```tsx
import { Checkbox } from "@/components/ui/checkbox";

<div className="flex items-center gap-2">
  <Checkbox id="terms" checked={accepted} onCheckedChange={setAccepted} />
  <Label htmlFor="terms">Acepto los términos</Label>
</div>
```

---

### 2.2 Switch

**Archivo:** `src/app/components/ui/switch.tsx`  
**Exportaciones:** `Switch`

#### Props

| Prop | Tipo | Descripción |
|------|------|-------------|
| `checked` | `boolean` | Estado controlado |
| `onCheckedChange` | `(checked: boolean) => void` | Callback |
| `disabled` | `boolean` | Estado deshabilitado |

#### Ejemplo de uso

```tsx
import { Switch } from "@/components/ui/switch";

<div className="flex items-center gap-2">
  <Switch checked={notifications} onCheckedChange={setNotifications} />
  <Label>Notificaciones por email</Label>
</div>
```

---

### 2.3 RadioGroup

**Archivo:** `src/app/components/ui/radio-group.tsx`  
**Exportaciones:** `RadioGroup`, `RadioGroupItem`

#### Props

| Componente | Props clave | Descripción |
|------------|------------|-------------|
| `RadioGroup` | `value`, `onValueChange`, `defaultValue` | Contenedor del grupo |
| `RadioGroupItem` | `value`, `id`, `disabled` | Opción individual |

#### Ejemplo de uso

```tsx
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

<RadioGroup value={role} onValueChange={setRole}>
  <div className="flex items-center gap-2">
    <RadioGroupItem value="admin" id="r-admin" />
    <Label htmlFor="r-admin">Administrador</Label>
  </div>
  <div className="flex items-center gap-2">
    <RadioGroupItem value="user" id="r-user" />
    <Label htmlFor="r-user">Usuario</Label>
  </div>
</RadioGroup>
```

---

### 2.4 Select

**Archivo:** `src/app/components/ui/select.tsx`  
**Exportaciones:** `Select`, `SelectGroup`, `SelectValue`, `SelectTrigger`, `SelectContent`, `SelectLabel`, `SelectItem`, `SelectSeparator`, `SelectScrollUpButton`, `SelectScrollDownButton`

#### Props clave

| Componente | Props | Descripción |
|------------|-------|-------------|
| `Select` | `value`, `onValueChange`, `defaultValue`, `open` | Raíz del select |
| `SelectTrigger` | `size?: 'sm' \| 'default'`, `className` | Botón disparador |
| `SelectItem` | `value`, `disabled` | Opción individual |

#### Ejemplo de uso

```tsx
import {
  Select, SelectTrigger, SelectValue,
  SelectContent, SelectItem
} from "@/components/ui/select";

<Select value={sortBy} onValueChange={setSortBy}>
  <SelectTrigger size="sm">
    <SelectValue placeholder="Ordenar por..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="name">Nombre</SelectItem>
    <SelectItem value="date">Fecha</SelectItem>
    <SelectItem value="size">Tamaño</SelectItem>
  </SelectContent>
</Select>
```

---

### 2.5 Form (React Hook Form)

**Archivo:** `src/app/components/ui/form.tsx`  
**Exportaciones:** `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage`, `useFormField`

#### Composición

```
Form (FormProvider)
└── FormField (Controller)
    └── FormItem
        ├── FormLabel
        ├── FormControl (Slot)
        │   └── Input / Select / Textarea
        ├── FormDescription
        └── FormMessage (error)
```

#### Características

- Genera IDs accesibles automáticamente
- Atributos `aria-*` aplicados al control
- `FormMessage` muestra el error de RHF automáticamente

#### Ejemplo de uso

```tsx
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

const form = useForm<FormData>();

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input type="email" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>
```

---

## 3. Contenedores y Tarjetas

### 3.1 Card

**Archivo:** `src/app/components/ui/card.tsx`  
**Exportaciones:** `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter`

#### Estructura

```
Card
├── CardHeader
│   ├── CardTitle
│   ├── CardDescription
│   └── CardAction (alineado a la derecha)
├── CardContent
└── CardFooter
```

#### Props (todos los sub-componentes)

| Prop | Tipo | Descripción |
|------|------|-------------|
| `className` | `string` | Clases adicionales |
| `...rest` | `HTMLAttributes<HTMLDivElement>` | Atributos HTML del div |

#### Características

- Fondo `bg-card`, borde `border-border`
- Backdrop blur para efecto de vidrio
- `CardHeader` usa container queries para layout responsivo
- `CardTitle` renderiza como `<h4>`

#### Ejemplo de uso

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Almacenamiento</CardTitle>
    <CardDescription>Uso actual del espacio</CardDescription>
    <CardAction>
      <Button variant="ghost" size="icon"><MoreVertical /></Button>
    </CardAction>
  </CardHeader>
  <CardContent>
    <Progress value={72} />
    <p className="text-sm text-muted-foreground mt-2">7.2 GB de 10 GB usados</p>
  </CardContent>
  <CardFooter className="border-t">
    <Button variant="outline" size="sm">Ampliar plan</Button>
  </CardFooter>
</Card>
```

---

### 3.2 Alert

**Archivo:** `src/app/components/ui/alert.tsx`  
**Exportaciones:** `Alert`, `AlertTitle`, `AlertDescription`

#### Props

| Componente | Props | Descripción |
|------------|-------|-------------|
| `Alert` | `variant?: 'default' \| 'destructive'`, `role="alert"` | Contenedor con ícono |
| `AlertTitle` | `className` | Título del alerta (h5) |
| `AlertDescription` | `className` | Cuerpo del alerta |

#### Ejemplo de uso

```tsx
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

<Alert variant="destructive">
  <AlertTriangle className="size-4" />
  <AlertTitle>Error de sincronización</AlertTitle>
  <AlertDescription>No se pudo conectar al servidor. Intente de nuevo.</AlertDescription>
</Alert>
```

---

### 3.3 ScrollArea

**Archivo:** `src/app/components/ui/scroll-area.tsx`  
**Exportaciones:** `ScrollArea`, `ScrollBar`

#### Props

| Componente | Props | Descripción |
|------------|-------|-------------|
| `ScrollArea` | `className` | Área con scroll personalizado |
| `ScrollBar` | `orientation?: 'vertical' \| 'horizontal'` | Barra de desplazamiento |

#### Ejemplo de uso

```tsx
import { ScrollArea } from "@/components/ui/scroll-area";

<ScrollArea className="h-72 w-full">
  {items.map(item => <FileRow key={item.id} file={item} />)}
</ScrollArea>
```

---

### 3.4 Collapsible

**Archivo:** `src/app/components/ui/collapsible.tsx`  
**Exportaciones:** `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent`

#### Props

| Componente | Props | Descripción |
|------------|-------|-------------|
| `Collapsible` | `open`, `onOpenChange`, `defaultOpen` | Raíz |
| `CollapsibleTrigger` | `asChild` | Control disparador |
| `CollapsibleContent` | `className` | Contenido colapsable |

#### Ejemplo de uso

```tsx
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

<Collapsible>
  <CollapsibleTrigger asChild>
    <Button variant="ghost">Ver más opciones</Button>
  </CollapsibleTrigger>
  <CollapsibleContent>
    <div className="space-y-2 pt-2">...</div>
  </CollapsibleContent>
</Collapsible>
```

---

### 3.5 Accordion

**Archivo:** `src/app/components/ui/accordion.tsx`  
**Exportaciones:** `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`

#### Props

| Componente | Props clave | Descripción |
|------------|------------|-------------|
| `Accordion` | `type: 'single' \| 'multiple'`, `collapsible` | Raíz |
| `AccordionItem` | `value` | Sección individual |
| `AccordionTrigger` | `className` | Encabezado con chevron animado |
| `AccordionContent` | `className` | Cuerpo animado |

#### Ejemplo de uso

```tsx
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

<Accordion type="single" collapsible>
  <AccordionItem value="permisos">
    <AccordionTrigger>Permisos de acceso</AccordionTrigger>
    <AccordionContent>Aquí van los controles de permisos...</AccordionContent>
  </AccordionItem>
</Accordion>
```

---

### 3.6 Tabs

**Archivo:** `src/app/components/ui/tabs.tsx`  
**Exportaciones:** `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`

#### Props

| Componente | Props clave | Descripción |
|------------|------------|-------------|
| `Tabs` | `value`, `onValueChange`, `defaultValue` | Raíz |
| `TabsList` | `className` | Barra de pestañas |
| `TabsTrigger` | `value` | Pestaña individual |
| `TabsContent` | `value` | Panel de contenido |

#### Ejemplo de uso

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

<Tabs defaultValue="archivos">
  <TabsList>
    <TabsTrigger value="archivos">Mis archivos</TabsTrigger>
    <TabsTrigger value="compartidos">Compartidos</TabsTrigger>
    <TabsTrigger value="recientes">Recientes</TabsTrigger>
  </TabsList>
  <TabsContent value="archivos"><FileGrid /></TabsContent>
  <TabsContent value="compartidos"><SharedFiles /></TabsContent>
  <TabsContent value="recientes"><RecentFiles /></TabsContent>
</Tabs>
```

---

## 4. Superposiciones y Diálogos

### 4.1 Modal

**Archivo:** `src/app/components/ui/modal.tsx`  
**Exportaciones:** `Modal`

> Wrapper simplificado sobre `Dialog`. Es el componente preferido para la mayoría de los casos de uso.

#### Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `open` | `boolean` | — | Estado del modal |
| `onOpenChange` | `(open: boolean) => void` | — | Callback de apertura/cierre |
| `title` | `string` | — | Título visible del modal |
| `description` | `string` | — | Descripción accesible |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Ancho máximo del modal |
| `children` | `ReactNode` | — | Contenido interno |

#### Tamaños

| Size | Ancho máximo |
|------|-------------|
| `sm` | 400px |
| `md` | 520px |
| `lg` | 720px |
| `xl` | 960px |

#### Ejemplo de uso

```tsx
import { Modal } from "@/components/ui/modal";

<Modal
  open={showUpload}
  onOpenChange={setShowUpload}
  title="Subir archivo"
  description="Selecciona un archivo de tu dispositivo"
  size="md"
>
  <UploadForm onSuccess={() => setShowUpload(false)} />
</Modal>
```

---

### 4.2 Dialog

**Archivo:** `src/app/components/ui/dialog.tsx`  
**Exportaciones:** `Dialog`, `DialogTrigger`, `DialogPortal`, `DialogClose`, `DialogOverlay`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`

> Usar cuando se necesite control total sobre la estructura del diálogo.

#### Ejemplo de uso

```tsx
import {
  Dialog, DialogTrigger, DialogContent,
  DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";

<Dialog>
  <DialogTrigger asChild>
    <Button>Compartir</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Compartir archivo</DialogTitle>
    </DialogHeader>
    <ShareForm />
    <DialogFooter>
      <Button variant="outline">Cancelar</Button>
      <Button>Confirmar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### 4.3 AlertDialog

**Archivo:** `src/app/components/ui/alert-dialog.tsx`  
**Exportaciones:** `AlertDialog`, `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogFooter`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogAction`, `AlertDialogCancel`

> Para confirmaciones críticas (eliminar, revocar acceso, etc.).

#### Ejemplo de uso

```tsx
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent,
  AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogAction, AlertDialogCancel
} from "@/components/ui/alert-dialog";

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Eliminar carpeta</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>¿Eliminar carpeta?</AlertDialogTitle>
      <AlertDialogDescription>
        Esta acción moverá todos los archivos a la papelera.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

### 4.4 Sheet

**Archivo:** `src/app/components/ui/sheet.tsx`  
**Exportaciones:** `Sheet`, `SheetTrigger`, `SheetClose`, `SheetContent`, `SheetHeader`, `SheetFooter`, `SheetTitle`, `SheetDescription`

#### Props clave

| Componente | Props | Descripción |
|------------|-------|-------------|
| `SheetContent` | `side?: 'top' \| 'right' \| 'bottom' \| 'left'` | Lado de aparición |

#### Ejemplo de uso

```tsx
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline">Filtros</Button>
  </SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Filtros de búsqueda</SheetTitle>
    </SheetHeader>
    <FilterPanel />
  </SheetContent>
</Sheet>
```

---

### 4.5 Drawer

**Archivo:** `src/app/components/ui/drawer.tsx`  
**Exportaciones:** `Drawer`, `DrawerTrigger`, `DrawerContent`, `DrawerHeader`, `DrawerFooter`, `DrawerTitle`, `DrawerDescription`, `DrawerClose`

> Optimizado para móvil con arrastre táctil. Basado en `vaul`.

#### Props clave

| Componente | Props | Descripción |
|------------|-------|-------------|
| `Drawer` | `direction?: 'top' \| 'bottom' \| 'left' \| 'right'` | Dirección del drawer |

#### Ejemplo de uso

```tsx
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

<Drawer direction="bottom">
  <DrawerTrigger asChild>
    <Button>Opciones del archivo</Button>
  </DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>documento.pdf</DrawerTitle>
    </DrawerHeader>
    <FileActions />
  </DrawerContent>
</Drawer>
```

---

### 4.6 Popover

**Archivo:** `src/app/components/ui/popover.tsx`  
**Exportaciones:** `Popover`, `PopoverTrigger`, `PopoverContent`, `PopoverAnchor`

#### Props clave

| Componente | Props | Descripción |
|------------|-------|-------------|
| `PopoverContent` | `align?: 'start' \| 'center' \| 'end'`, `sideOffset?` | Posicionamiento |

#### Ejemplo de uso

```tsx
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline" size="sm">
      <CalendarIcon className="size-4 mr-2" />
      Fecha
    </Button>
  </PopoverTrigger>
  <PopoverContent align="start">
    <DatePicker />
  </PopoverContent>
</Popover>
```

---

### 4.7 HoverCard

**Archivo:** `src/app/components/ui/hover-card.tsx`  
**Exportaciones:** `HoverCard`, `HoverCardTrigger`, `HoverCardContent`

> Para previsualizaciones al hacer hover sobre un elemento.

#### Ejemplo de uso

```tsx
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";

<HoverCard>
  <HoverCardTrigger asChild>
    <Button variant="link">{file.name}</Button>
  </HoverCardTrigger>
  <HoverCardContent>
    <FilePreview file={file} />
  </HoverCardContent>
</HoverCard>
```

---

### 4.8 Tooltip

**Archivo:** `src/app/components/ui/tooltip.tsx`  
**Exportaciones:** `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider`

> `TooltipProvider` debe envolver la aplicación o la sección que use tooltips.

#### Props clave

| Componente | Props | Descripción |
|------------|-------|-------------|
| `TooltipProvider` | `delayDuration?: number` (default: 0) | Proveedor de contexto |
| `TooltipContent` | `side?`, `align?` | Posicionamiento |

#### Ejemplo de uso

```tsx
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="icon">
        <Share2 className="size-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>Compartir archivo</TooltipContent>
  </Tooltip>
</TooltipProvider>
```

---

## 5. Navegación y Listas

### 5.1 DropdownMenu

**Archivo:** `src/app/components/ui/dropdown-menu.tsx`  
**Exportaciones:** `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuGroup`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, `DropdownMenuSeparator`, `DropdownMenuShortcut`, `DropdownMenuSub`, `DropdownMenuSubTrigger`, `DropdownMenuSubContent`

#### Props clave

| Componente | Props | Descripción |
|------------|-------|-------------|
| `DropdownMenuItem` | `variant?: 'default' \| 'destructive'`, `inset?` | Ítem del menú |

#### Ejemplo de uso

```tsx
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuShortcut
} from "@/components/ui/dropdown-menu";

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon"><MoreVertical className="size-4" /></Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem>
      <Pencil className="size-4" />
      Renombrar
      <DropdownMenuShortcut>F2</DropdownMenuShortcut>
    </DropdownMenuItem>
    <DropdownMenuItem>
      <Share2 className="size-4" />
      Compartir
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive">
      <Trash2 className="size-4" />
      Eliminar
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

### 5.2 Breadcrumb

**Archivo:** `src/app/components/ui/breadcrumb.tsx`  
**Exportaciones:** `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator`, `BreadcrumbEllipsis`

#### Ejemplo de uso

```tsx
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem,
  BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Mi unidad</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/proyectos">Proyectos</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>2024</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

---

### 5.3 Pagination

**Archivo:** `src/app/components/ui/pagination.tsx`  
**Exportaciones:** `Pagination`, `PaginationContent`, `PaginationItem`, `PaginationLink`, `PaginationPrevious`, `PaginationNext`, `PaginationEllipsis`

#### Props clave

| Componente | Props | Descripción |
|------------|-------|-------------|
| `PaginationLink` | `isActive?: boolean`, `href` | Número de página |

#### Ejemplo de uso

```tsx
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis
} from "@/components/ui/pagination";

<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious href="#" onClick={() => setPage(p => p - 1)} />
    </PaginationItem>
    {pages.map(p => (
      <PaginationItem key={p}>
        <PaginationLink isActive={p === currentPage} onClick={() => setPage(p)}>{p}</PaginationLink>
      </PaginationItem>
    ))}
    <PaginationItem>
      <PaginationNext href="#" onClick={() => setPage(p => p + 1)} />
    </PaginationItem>
  </PaginationContent>
</Pagination>
```

---

### 5.4 Table

**Archivo:** `src/app/components/ui/table.tsx`  
**Exportaciones:** `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableHead`, `TableRow`, `TableCell`, `TableCaption`

#### Estructura

```
Table
├── TableHeader
│   └── TableRow
│       └── TableHead (columnas)
├── TableBody
│   └── TableRow (fila de datos)
│       └── TableCell
└── TableFooter (opcional)
```

#### Ejemplo de uso

```tsx
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Nombre</TableHead>
      <TableHead>Tamaño</TableHead>
      <TableHead>Modificado</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {files.map(f => (
      <TableRow key={f.id}>
        <TableCell>{f.name}</TableCell>
        <TableCell>{f.size}</TableCell>
        <TableCell>{f.modifiedAt}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

### 5.5 Command

**Archivo:** `src/app/components/ui/command.tsx`  
**Exportaciones:** `Command`, `CommandDialog`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandSeparator`, `CommandItem`, `CommandShortcut`

> Paleta de comandos con búsqueda. Usa `CommandDialog` para integración en modal.

#### Ejemplo de uso

```tsx
import {
  CommandDialog, CommandInput, CommandList,
  CommandEmpty, CommandGroup, CommandItem
} from "@/components/ui/command";

<CommandDialog open={open} onOpenChange={setOpen}>
  <CommandInput placeholder="Buscar archivos, carpetas..." />
  <CommandList>
    <CommandEmpty>Sin resultados.</CommandEmpty>
    <CommandGroup heading="Archivos recientes">
      {recentFiles.map(f => (
        <CommandItem key={f.id} onSelect={() => openFile(f)}>
          <FileIcon className="size-4 mr-2" />
          {f.name}
        </CommandItem>
      ))}
    </CommandGroup>
  </CommandList>
</CommandDialog>
```

---

## 6. Componentes de Aplicación

### 6.1 Logo

**Archivo:** `src/app/components/Logo.tsx`  
**Exportaciones:** `Logo`

#### Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Tamaño del logo |
| `showText` | `boolean` | `true` | Muestra "Infinity Vault" junto al ícono |
| `className` | `string` | — | Clases adicionales |

#### Ejemplo de uso

```tsx
import { Logo } from "@/components/Logo";

<Logo size="lg" showText />          {/* En la pantalla de login */}
<Logo size="sm" showText={false} />  {/* En sidebar colapsado */}
```

---

### 6.2 Navbar

**Archivo:** `src/app/components/layout/Navbar.tsx`  
**Exportaciones:** `Navbar`

#### Props

| Prop | Tipo | Descripción |
|------|------|-------------|
| `onNewFile` | `() => void` | Abre el diálogo de nuevo archivo |
| `onOpenAI` | `() => void` | Abre el panel del AI Assistant |
| `onOpenAdvancedSearch` | `() => void` | Abre la búsqueda avanzada |
| `userName` | `string` | Nombre del usuario autenticado |
| `userEmail` | `string` | Email del usuario autenticado |
| `onLogout` | `() => void` | Acción de cierre de sesión |
| `isAdmin` | `boolean` | Muestra controles de administrador |

#### Composición interna

- Campo de búsqueda rápida (`Input`)
- Botón de AI Assistant (solo usuarios normales)
- Campana de notificaciones
- Avatar con `DropdownMenu` de cuenta

---

### 6.3 Sidebar

**Archivo:** `src/app/components/layout/Sidebar.tsx`  
**Exportaciones:** `Sidebar`

#### Props

| Prop | Tipo | Descripción |
|------|------|-------------|
| `currentView` | `string` | Vista activa (resalta el ítem correspondiente) |
| `onViewChange` | `(view: string) => void` | Navega a otra vista |
| `isAdmin` | `boolean` | Muestra ítems de administrador |
| `onNewFile` | `() => void` | Abre el diálogo de nuevo archivo |

#### Vistas disponibles (usuario)

| `view` | Descripción |
|--------|-------------|
| `dashboard` | Inicio |
| `files` | Mis archivos |
| `shared` | Compartidos |
| `recent` | Recientes |
| `starred` | Destacados |
| `trash` | Papelera |
| `shared-drives` | Unidades compartidas |
| `settings` | Configuración |
| `billing` | Facturación |

#### Vistas disponibles (admin)

| `view` | Descripción |
|--------|-------------|
| `admin-dashboard` | Panel de administrador |
| `admin-users` | Gestión de usuarios |
| `admin-storage` | Gestión de almacenamiento |
| `admin-audit` | Bitácora de auditoría |
| `admin-settings` | Configuración del sistema |

---

### 6.4 NewFileMenu

**Archivo:** `src/app/components/layout/NewFileMenu.tsx`  
**Exportaciones:** `NewFileMenu`

#### Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `collapsed` | `boolean` | `false` | Modo compacto para sidebar colapsado |

#### Ejemplo de uso

```tsx
import { NewFileMenu } from "@/components/layout/NewFileMenu";

<NewFileMenu collapsed={isSidebarCollapsed} />
```

---

### 6.5 ImageWithFallback

**Archivo:** `src/app/components/figma/ImageWithFallback.tsx`  
**Exportaciones:** `ImageWithFallback`

#### Props

| Prop | Tipo | Descripción |
|------|------|-------------|
| `src` | `string` | URL de la imagen |
| `alt` | `string` | Texto alternativo |
| `...rest` | `ImgHTMLAttributes` | Atributos nativos del img |

#### Características

- Muestra un SVG placeholder si la imagen falla al cargar
- Manejo de estado de error transparente

#### Ejemplo de uso

```tsx
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";

<ImageWithFallback
  src={user.avatarUrl}
  alt="Foto de perfil"
  className="w-16 h-16 rounded-full object-cover"
/>
```

---

## 7. Utilidades

### 7.1 cn()

**Archivo:** `src/app/components/ui/utils.ts`  
**Exportaciones:** `cn`

Combina `clsx` con `tailwind-merge` para resolver conflictos de clases Tailwind.

```tsx
import { cn } from "@/components/ui/utils";

<div className={cn(
  "base-class",
  isActive && "active-class",
  className   // prop externa, siempre al final
)} />
```

---

### 7.2 useIsMobile

**Archivo:** `src/app/components/ui/use-mobile.ts`  
**Exportaciones:** `useIsMobile`

Hook reactivo que devuelve `true` cuando el ancho de ventana es menor a `768px`.

```tsx
import { useIsMobile } from "@/components/ui/use-mobile";

const isMobile = useIsMobile();

return isMobile
  ? <Drawer>...</Drawer>
  : <Sheet>...</Sheet>;
```

---

### 7.3 VisuallyHidden

**Archivo:** `src/app/components/ui/visually-hidden.tsx`  
**Exportaciones:** `VisuallyHidden`

Envuelve contenido que debe ser leído por lectores de pantalla pero no visible visualmente. Basado en Radix UI.

```tsx
import { VisuallyHidden } from "@/components/ui/visually-hidden";

<Dialog>
  <DialogContent>
    <VisuallyHidden>
      <DialogTitle>Subir archivo</DialogTitle>
    </VisuallyHidden>
    {/* contenido visual sin título visible */}
  </DialogContent>
</Dialog>
```

---

## Convenciones de diseño

### Tokens CSS utilizados

| Token | Descripción |
|-------|-------------|
| `--background` | Fondo principal de la página |
| `--foreground` | Texto principal |
| `--card` | Fondo de tarjetas y paneles |
| `--border` | Color de bordes |
| `--input` | Fondo de campos de formulario |
| `--ring` | Color del focus ring |
| `--primary` | Color primario (azul #2563EB) |
| `--secondary` | Color secundario |
| `--muted` | Texto y fondos atenuados |
| `--accent` | Color de acento |
| `--destructive` | Color de acciones destructivas |
| `--vault-blue` | `#2563EB` (modo claro) / `#0052FF` (modo oscuro) |
| `--vault-purple` | `#7C3AED` / `#7000FF` |
| `--vault-cyan` | `#06B6D4` / `#00F0FF` |

### Reglas de composición

1. **Siempre usar `cn()`** al combinar clases fijas con props `className`.
2. **No hardcodear colores** — usar siempre clases semánticas (`text-foreground`, `bg-card`, `border-border`) o tokens `var(--vault-*)`.
3. **El cambio de tema** es global: basta con alternar la clase `dark` en `<html>`.
4. **Accesibilidad**: preferir componentes Radix sobre elementos HTML planos cuando haya interactividad.
5. **Variante `asChild`**: disponible en Button, Badge, Sheet, Dialog y más. Permite usar el componente sin añadir un nodo DOM extra.

---

*Generado para Infinity Vault — Sistema de almacenamiento documental en la nube.*
