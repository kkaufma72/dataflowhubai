import React, { useState } from 'react';
import { 
  // Core
  Button,
  Badge,
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  
  // Form
  Input,
  Label,
  Select,
  Textarea,
  Checkbox,
  Switch,
  
  // Feedback
  Alert, AlertTitle, AlertDescription,
  Toast,
  Skeleton, SkeletonText, SkeletonCard,
  Spinner, LoadingInline,
  Progress, CircularProgress,
  
  // Overlay
  Modal, ModalHeader, ModalBody, ModalFooter, ModalTitle,
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Tooltip, TooltipTrigger, TooltipContent, TooltipProvider,
  Popover, PopoverTrigger, PopoverContent,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  
  // Navigation
  Tabs, TabsList, TabsTrigger, TabsContent,
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage,
  
  // Data Display
  Avatar, AvatarImage, AvatarFallback, AvatarGroup,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  
  // Layout
  Separator,
} from '@/components/ui';
import { 
  Home, Settings, User, Bell, Search, Plus, MoreHorizontal, 
  Check, X, AlertCircle, Info, ChevronRight, Download, Edit, Trash2
} from 'lucide-react';

const ComponentShowcase: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [switchValue, setSwitchValue] = useState(false);
  const [checkboxValue, setCheckboxValue] = useState(false);
  const [progressValue, setProgressValue] = useState(65);
  const [inputValue, setInputValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Component Showcase</h1>
          <p className="text-lg text-gray-600">DataFlowHub UI Component Library</p>
        </div>

        {/* Buttons Section */}
        <Section title="Buttons" description="Button variants and sizes">
          <div className="flex flex-wrap gap-4">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon"><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            <Button disabled>Disabled</Button>
            <Button><Spinner size="sm" variant="white" /> Loading</Button>
          </div>
        </Section>

        {/* Badges Section */}
        <Section title="Badges" description="Status indicators and labels">
          <div className="flex flex-wrap gap-3">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </Section>

        {/* Cards Section */}
        <Section title="Cards" description="Container components">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>Card description goes here</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">This is the card content area.</p>
              </CardContent>
              <CardFooter className="justify-end gap-2">
                <Button variant="outline" size="sm">Cancel</Button>
                <Button size="sm">Save</Button>
              </CardFooter>
            </Card>

            <Card className="border-primary/50">
              <CardHeader className="bg-primary/5">
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-gray-600">You have 3 new notifications.</p>
              </CardContent>
            </Card>

            <SkeletonCard />
          </div>
        </Section>

        {/* Form Controls Section */}
        <Section title="Form Controls" description="Input elements and form components">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="input-demo" required>Text Input</Label>
                <Input 
                  id="input-demo"
                  placeholder="Enter text..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="input-icon">With Icons</Label>
                <Input 
                  id="input-icon"
                  placeholder="Search..."
                  leftIcon={<Search className="h-4 w-4" />}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="input-error">With Error</Label>
                <Input 
                  id="input-error"
                  placeholder="Invalid input"
                  error="This field is required"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="select-demo" optional>Select</Label>
                <Select id="select-demo" className="mt-1">
                  <option value="">Choose an option...</option>
                  <option value="1">Option 1</option>
                  <option value="2">Option 2</option>
                  <option value="3">Option 3</option>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="textarea-demo">Textarea</Label>
                <Textarea 
                  id="textarea-demo"
                  placeholder="Enter description..."
                  value={textareaValue}
                  onChange={(e) => setTextareaValue(e.target.value)}
                  showCount
                  maxLength={200}
                  className="mt-1"
                />
              </div>

              <div className="space-y-3">
                <Checkbox 
                  label="Accept terms and conditions"
                  description="By checking this, you agree to our terms"
                  checked={checkboxValue}
                  onChange={(e) => setCheckboxValue(e.target.checked)}
                />

                <Switch 
                  label="Enable notifications"
                  description="Get notified about updates"
                  checked={switchValue}
                  onChange={(e) => setSwitchValue(e.target.checked)}
                />
              </div>
            </div>
          </div>
        </Section>

        {/* Alerts Section */}
        <Section title="Alerts" description="Feedback messages">
          <div className="space-y-4">
            <Alert variant="info">
              <AlertTitle>Information</AlertTitle>
              <AlertDescription>This is an informational message.</AlertDescription>
            </Alert>
            <Alert variant="success">
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>Your changes have been saved.</AlertDescription>
            </Alert>
            <Alert variant="warning">
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>Please review before continuing.</AlertDescription>
            </Alert>
            <Alert variant="error" dismissible onDismiss={() => {}}>
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Something went wrong. Please try again.</AlertDescription>
            </Alert>
          </div>
        </Section>

        {/* Toast Section */}
        <Section title="Toasts" description="Notification toasts">
          <div className="space-y-4">
            <Toast variant="success" title="Success!" description="Your file has been uploaded." onClose={() => {}} />
            <Toast variant="error" title="Error" description="Failed to save changes." onClose={() => {}} />
            <Toast variant="info" title="Tip" description="Press Ctrl+S to save." />
          </div>
        </Section>

        {/* Progress Section */}
        <Section title="Progress" description="Loading and progress indicators">
          <div className="space-y-6">
            <div className="space-y-4">
              <Progress value={progressValue} showLabel labelPosition="outside" />
              <Progress value={45} variant="success" showLabel labelPosition="top" />
              <Progress value={80} variant="warning" size="lg" showLabel labelPosition="inside" />
              <Progress indeterminate variant="info" />
            </div>
            
            <div className="flex items-center gap-8">
              <CircularProgress value={75} showLabel />
              <CircularProgress value={45} variant="success" showLabel size={64} />
              <CircularProgress value={90} variant="warning" showLabel size={80} strokeWidth={6} />
            </div>

            <div className="flex items-center gap-4">
              <Spinner size="sm" />
              <Spinner size="md" variant="primary" />
              <Spinner size="lg" variant="primary" label="Loading..." />
            </div>
          </div>
        </Section>

        {/* Skeletons Section */}
        <Section title="Skeletons" description="Loading placeholders">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <SkeletonText lines={3} />
            </div>
            <SkeletonCard />
          </div>
        </Section>

        {/* Tabs Section */}
        <Section title="Tabs" description="Tabbed navigation">
          <Tabs defaultValue="tab1">
            <TabsList>
              <TabsTrigger value="tab1">Overview</TabsTrigger>
              <TabsTrigger value="tab2">Analytics</TabsTrigger>
              <TabsTrigger value="tab3">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="tab1">
              <Card>
                <CardContent className="pt-6">
                  <p>Overview content goes here.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="tab2">
              <Card>
                <CardContent className="pt-6">
                  <p>Analytics content goes here.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="tab3">
              <Card>
                <CardContent className="pt-6">
                  <p>Settings content goes here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </Section>

        {/* Breadcrumb Section */}
        <Section title="Breadcrumb" description="Navigation path">
          <Breadcrumb>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Projects</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbPage>Current Page</BreadcrumbPage>
            </BreadcrumbItem>
          </Breadcrumb>
        </Section>

        {/* Avatar Section */}
        <Section title="Avatars" description="User avatars and groups">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4">
              <Avatar size="xs"><AvatarFallback>XS</AvatarFallback></Avatar>
              <Avatar size="sm"><AvatarFallback>SM</AvatarFallback></Avatar>
              <Avatar size="md"><AvatarFallback>MD</AvatarFallback></Avatar>
              <Avatar size="lg"><AvatarFallback>LG</AvatarFallback></Avatar>
              <Avatar size="xl"><AvatarFallback>XL</AvatarFallback></Avatar>
            </div>
            
            <Separator orientation="vertical" className="h-12" />
            
            <AvatarGroup max={3}>
              <Avatar><AvatarFallback>JD</AvatarFallback></Avatar>
              <Avatar><AvatarFallback>AB</AvatarFallback></Avatar>
              <Avatar><AvatarFallback>CD</AvatarFallback></Avatar>
              <Avatar><AvatarFallback>EF</AvatarFallback></Avatar>
              <Avatar><AvatarFallback>GH</AvatarFallback></Avatar>
            </AvatarGroup>
          </div>
        </Section>

        {/* Table Section */}
        <Section title="Table" description="Data tables">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">John Doe</TableCell>
                  <TableCell><Badge variant="secondary">Active</Badge></TableCell>
                  <TableCell>Admin</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Jane Smith</TableCell>
                  <TableCell><Badge variant="secondary">Active</Badge></TableCell>
                  <TableCell>Editor</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Bob Wilson</TableCell>
                  <TableCell><Badge variant="outline">Pending</Badge></TableCell>
                  <TableCell>Viewer</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </Section>

        {/* Overlay Components Section */}
        <Section title="Overlays" description="Modal, Dialog, Popover, Dropdown, Tooltip">
          <div className="flex flex-wrap gap-4">
            {/* Modal */}
            <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
            <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
              <ModalHeader>
                <ModalTitle>Modal Title</ModalTitle>
              </ModalHeader>
              <ModalBody>
                <p className="text-gray-600">This is the modal content. You can put any content here.</p>
              </ModalBody>
              <ModalFooter>
                <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button onClick={() => setModalOpen(false)}>Confirm</Button>
              </ModalFooter>
            </Modal>

            {/* Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Open Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you sure?</DialogTitle>
                  <DialogDescription>This action cannot be undone.</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button variant="destructive">Delete</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">Open Popover</Button>
              </PopoverTrigger>
              <PopoverContent>
                <div className="space-y-2">
                  <h4 className="font-medium">Popover Title</h4>
                  <p className="text-sm text-gray-500">This is popover content.</p>
                </div>
              </PopoverContent>
            </Popover>

            {/* Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => console.log('Edit')}>
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => console.log('Download')}>
                  <Download className="h-4 w-4 mr-2" /> Download
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => console.log('Delete')} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Tooltip */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">Hover for Tooltip</Button>
                </TooltipTrigger>
                <TooltipContent>
                  This is a tooltip!
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </Section>

        {/* Separator */}
        <Separator className="my-8" />

        <div className="text-center text-gray-500 text-sm">
          <p>DataFlowHub Design System • {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
};

// Section component for consistent layout
const Section: React.FC<{ 
  title: string; 
  description: string; 
  children: React.ReactNode;
}> = ({ title, description, children }) => (
  <section>
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      <p className="text-gray-600 mt-1">{description}</p>
    </div>
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {children}
    </div>
  </section>
);

export default ComponentShowcase;
