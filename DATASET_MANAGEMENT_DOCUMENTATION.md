# Dataset Management Feature - Technical Documentation

## Overview
A comprehensive dataset management system with a collapsible sidebar, localStorage persistence, and professional browse/upload interface for organizing datasets across cloud-native projects.

---

## Architecture

### Components Structure
```
src/
├── hooks/
│   ├── useSidebarState.ts              # localStorage state management
│   └── __tests__/
│       └── useSidebarState.test.ts     # Unit tests
├── components/
│   └── datasets/
│       ├── ProjectSidebar.tsx          # Collapsible project hierarchy
│       └── DatasetBrowseUpload.tsx     # Main browse/upload interface
```

---

## Core Features

### 1. Collapsible Sidebar (`ProjectSidebar.tsx`)

#### Purpose
Displays hierarchical project structure with datasets, allowing users to navigate and filter their data efficiently.

#### Key Features
- **Project Hierarchy**: Expandable/collapsible project folders
- **Dataset Listing**: Shows all datasets within each project
- **Metadata Display**: File size, date, row/column counts
- **Visual Indicators**: Icons for projects and datasets
- **Selection State**: Highlights currently selected dataset

#### Props
```typescript
interface ProjectSidebarProps {
  projects: Project[];              // List of projects
  datasets: Dataset[];              // All datasets
  selectedProjectIds: string[];     // Currently selected projects
  onToggleProject: (id: string) => void;  // Toggle project expansion
  onSelectDataset: (dataset: Dataset) => void;  // Dataset selection
  selectedDatasetId?: string;       // Currently selected dataset
  className?: string;               // Custom styling
}
```

#### Usage Example
```typescript
<ProjectSidebar
  projects={projects}
  datasets={datasets}
  selectedProjectIds={selectedProjectIds}
  onToggleProject={toggleProjectId}
  onSelectDataset={handleSelectDataset}
  selectedDatasetId={selectedDataset?.id}
/>
```

---

### 2. Sidebar State Hook (`useSidebarState.ts`)

#### Purpose
Manages sidebar state with automatic localStorage persistence for seamless user experience across page reloads.

#### State Interface
```typescript
interface SidebarState {
  isCollapsed: boolean;           // Sidebar collapse state
  selectedProjectIds: string[];   // Currently selected projects
  lastViewedDatasetId: string | null;  // Last viewed dataset
}
```

#### API Methods
```typescript
const {
  // State
  isCollapsed,              // boolean
  selectedProjectIds,       // string[]
  lastViewedDatasetId,      // string | null
  isLoaded,                 // boolean (initial load complete)
  
  // Actions
  toggleSidebar,           // () => void
  addProjectId,            // (id: string) => void
  removeProjectId,         // (id: string) => void
  toggleProjectId,         // (id: string) => void
  setProjectIds,           // (ids: string[]) => void
  updateLastViewedDataset, // (id: string | null) => void
  clearState,              // () => void
} = useSidebarState();
```

#### Storage Key
- **Key**: `datasetSidebarState`
- **Format**: JSON string
- **Persistence**: localStorage
- **Scope**: Per browser/domain

#### Usage Example
```typescript
const {
  isCollapsed,
  selectedProjectIds,
  toggleSidebar,
  toggleProjectId,
} = useSidebarState();

// Toggle sidebar
<button onClick={toggleSidebar}>
  {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
</button>

// Toggle project selection
<button onClick={() => toggleProjectId(projectId)}>
  {selectedProjectIds.includes(projectId) ? 'Deselect' : 'Select'}
</button>
```

---

### 3. Browse/Upload Page (`DatasetBrowseUpload.tsx`)

#### Purpose
Main interface for browsing, searching, and uploading datasets with project filtering.

#### Key Features
- **Collapsible Sidebar**: Toggle project hierarchy visibility
- **Search Functionality**: Filter datasets by name, description, file type
- **View Modes**: Grid view or list view
- **Sorting**: By date, name, or size
- **Upload Modal**: Inline dataset upload interface
- **Selection State**: Persistent dataset selection
- **Empty States**: Helpful messages for no projects/datasets

#### State Management
```typescript
const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
const [showUploader, setShowUploader] = useState(false);
const [searchQuery, setSearchQuery] = useState('');
const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
```

#### Data Flow
```
1. Load sidebar state from localStorage (via useSidebarState)
2. Filter datasets by selected projects
3. Apply search query
4. Sort results
5. Display in grid/list view
6. Update localStorage on state changes
```

---

## LocalStorage Persistence

### Storage Strategy

#### Key Features
- **Automatic Saving**: State persists on every change
- **Lazy Loading**: Restored on application mount
- **Error Handling**: Graceful fallback if localStorage unavailable
- **State Consistency**: Prevents data loss during navigation/reloads

#### Data Stored
```json
{
  "isCollapsed": false,
  "selectedProjectIds": ["project-1", "project-2"],
  "lastViewedDatasetId": "dataset-123"
}
```

#### Load Sequence
1. **Mount**: Hook initializes, loads from localStorage
2. **Parse**: JSON parsed with error handling
3. **Set State**: React state updated with stored values
4. **Flag Loaded**: `isLoaded` set to true
5. **Ready**: Component can safely use state

#### Save Sequence
1. **State Change**: User toggles sidebar, selects project, etc.
2. **Effect Triggers**: `useEffect` detects state change
3. **Check Loaded**: Only saves after initial load complete
4. **Serialize**: State converted to JSON
5. **Save**: Stored in localStorage with key `datasetSidebarState`

---

## Cloud-Native Platform Integration

### Project Detection

#### Has Cloud Projects
```typescript
const hasCloudProjects = useMemo(() => {
  return selectedProjectIds.length > 0 || projects.length > 0;
}, [selectedProjectIds, projects]);
```

#### Conditional Rendering
- **With Projects**: Show sidebar with project hierarchy
- **Without Projects**: Show informational message + direct upload

#### Example States

**State 1: No Cloud Projects**
```
┌─────────────────────────────────────┐
│  No Cloud Projects Connected        │
│  [Connect Cloud Platform]           │
│  ↓                                  │
│  Browse/Upload View (simplified)    │
└─────────────────────────────────────┘
```

**State 2: With Cloud Projects**
```
┌────────┬──────────────────────────┐
│ [<]    │  Datasets                │
│ Proj 1 │  [Search] [Grid/List]    │
│  ├─DS1 │  ┌────┐ ┌────┐ ┌────┐  │
│  └─DS2 │  │DS1 │ │DS2 │ │DS3 │  │
│ Proj 2 │  └────┘ └────┘ └────┘  │
└────────┴──────────────────────────┘
```

---

## User Experience Flow

### First Visit
1. User lands on dataset page
2. No localStorage data exists
3. Sidebar collapsed by default
4. All projects shown in sidebar
5. All datasets visible in main area

### Selecting Projects
1. User expands project in sidebar
2. Datasets listed under project
3. User clicks project name to toggle filter
4. Main area updates to show only that project's datasets
5. Selection stored in localStorage
6. Page reload preserves filter

### Viewing Datasets
1. User clicks dataset in sidebar or main area
2. Dataset becomes "selected" (highlighted)
3. Selection stored as `lastViewedDatasetId`
4. Page reload automatically selects same dataset
5. Seamless continuation of work

### Collapsing Sidebar
1. User clicks collapse button (chevron icon)
2. Sidebar slides out of view
3. Main area expands to full width
4. Collapse state saved to localStorage
5. Next visit respects collapsed state

---

## Testing Strategy

### Unit Tests Coverage
Location: `src/hooks/__tests__/useSidebarState.test.ts`

#### Test Cases
1. **Initialization**
   - Default values (collapsed=false, empty arrays)
   - Loading from empty localStorage

2. **Toggle Operations**
   - Sidebar collapse/expand
   - Project selection toggle
   - Multiple toggles

3. **Project Management**
   - Add single project ID
   - Add multiple project IDs
   - Remove project ID
   - Prevent duplicate additions

4. **Dataset Tracking**
   - Update last viewed dataset
   - Clear last viewed dataset

5. **Persistence**
   - Save to localStorage after changes
   - Restore from localStorage on mount
   - Handle malformed JSON gracefully

6. **Error Handling**
   - localStorage quota exceeded
   - JSON parse errors
   - Missing localStorage API

7. **State Clearing**
   - Clear all state
   - Remove localStorage entry
   - Reset to defaults

### Running Tests
```bash
# Run all tests
npm run test

# Run sidebar tests only
npm run test useSidebarState

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

---

## Configuration

### Dependencies
- **React**: Core framework
- **TypeScript**: Type safety
- **Lucide React**: Icon library
- **React Hot Toast**: Notifications

### Environment
No special environment variables required. Uses browser's localStorage API.

### Browser Compatibility
- **localStorage**: IE8+, all modern browsers
- **JSON.parse/stringify**: All modern browsers
- **React Hooks**: React 16.8+

---

## API Integration Points

### Supabase/Backend
Currently using mock data. In production:

```typescript
// Fetch projects from API
const { data: projects } = await supabase
  .from('projects')
  .select('*')
  .eq('user_id', user.id);

// Fetch datasets with project association
const { data: datasets } = await supabase
  .from('datasets')
  .select('*')
  .eq('user_id', user.id)
  .order('date_uploaded', { ascending: false });
```

### Project Association
Datasets linked to projects via `projectId` field:

```typescript
interface Dataset {
  id: string;
  name: string;
  projectId: string;  // ← Links to Project.id
  // ... other fields
}
```

---

## Performance Optimization

### Memoization
```typescript
// Filter datasets only when dependencies change
const filteredDatasets = useMemo(() => {
  // Expensive filtering logic
}, [datasets, searchQuery, selectedProjectIds, sortBy]);
```

### Lazy Updates
```typescript
// Only save to localStorage after initial load
useEffect(() => {
  if (!isLoaded) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}, [state, isLoaded]);
```

### Debouncing (Future Enhancement)
```typescript
// Debounce search input (not yet implemented)
const debouncedSearch = useDebounce(searchQuery, 300);
```

---

## Security Considerations

### LocalStorage Safety
- **No Sensitive Data**: Only stores UI state (IDs, not content)
- **Per-Domain**: Isolated to application domain
- **Client-Side Only**: Never transmitted to server
- **JSON Serialization**: Safe string storage

### XSS Prevention
- **React Auto-Escaping**: All user input escaped
- **No dangerouslySetInnerHTML**: Avoiding XSS vectors
- **Validated IDs**: UUIDs validated before use

---

## Troubleshooting

### Issue: State Not Persisting
**Symptoms**: Changes lost on page reload
**Causes**:
- localStorage disabled in browser
- Private/incognito mode
- Quota exceeded

**Solutions**:
1. Check browser localStorage enabled
2. Clear localStorage if corrupted
3. Verify `isLoaded` flag is true before saving

### Issue: Projects Not Showing
**Symptoms**: Empty sidebar, no projects listed
**Causes**:
- No projects created yet
- API call failed
- Wrong user ID filter

**Solutions**:
1. Create initial project
2. Check network tab for API errors
3. Verify user authentication

### Issue: Datasets Not Filtering
**Symptoms**: Selecting project doesn't filter datasets
**Causes**:
- `projectId` field missing on datasets
- Filter logic not applied
- State not updating

**Solutions**:
1. Ensure all datasets have valid `projectId`
2. Check `filteredDatasets` memo dependencies
3. Verify `selectedProjectIds` updates correctly

---

## Future Enhancements

### Planned Features
1. **Multi-Select**: Select multiple projects simultaneously
2. **Drag & Drop**: Drag datasets between projects
3. **Nested Projects**: Support project hierarchies
4. **Custom Views**: Save custom filter combinations
5. **Recent Items**: Quick access to recently viewed datasets
6. **Favorites**: Star/bookmark important datasets
7. **Bulk Operations**: Select and move multiple datasets
8. **Search History**: Track and suggest previous searches

### API Enhancements
1. **Real-Time Sync**: WebSocket updates for collaborative editing
2. **Cloud Storage**: Sync sidebar state across devices
3. **Team Projects**: Shared project workspaces
4. **Permissions**: Role-based access control

---

## Code Maintenance

### Adding New Sidebar State
```typescript
// 1. Update interface
interface SidebarState {
  // ... existing fields
  newField: string;  // ← Add here
}

// 2. Update hook state
const [newField, setNewField] = useState<string>('');

// 3. Update persistence
useEffect(() => {
  const state: SidebarState = {
    // ... existing fields
    newField,  // ← Include in save
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}, [/* deps */, newField]);  // ← Add dependency

// 4. Add action
const updateNewField = useCallback((value: string) => {
  setNewField(value);
}, []);

// 5. Export in return
return {
  // ... existing exports
  newField,
  updateNewField,
};
```

### Adding New Filter
```typescript
// 1. Add to state
const [newFilter, setNewFilter] = useState<FilterType>('all');

// 2. Update filtering logic
const filteredDatasets = useMemo(() => {
  let result = [...datasets];
  
  // Apply new filter
  if (newFilter !== 'all') {
    result = result.filter(ds => ds.filterField === newFilter);
  }
  
  return result;
}, [datasets, newFilter]);  // ← Add dependency

// 3. Add UI control
<select value={newFilter} onChange={(e) => setNewFilter(e.target.value)}>
  <option value="all">All</option>
  <option value="option1">Option 1</option>
</select>
```

---

## Migration Guide

### From Existing DataManagement Page
```typescript
// Old approach (no sidebar state)
const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);

// New approach (with sidebar state)
import { useSidebarState } from '../hooks/useSidebarState';

const {
  isCollapsed,
  selectedProjectIds,
  toggleSidebar,
  toggleProjectId,
} = useSidebarState();

// Sidebar automatically persists state
```

### Data Model Changes Required
```sql
-- Ensure datasets have project association
ALTER TABLE datasets ADD COLUMN project_id UUID REFERENCES projects(id);

-- Set default project for existing datasets
UPDATE datasets SET project_id = (SELECT id FROM projects WHERE name = 'Default Project' LIMIT 1)
WHERE project_id IS NULL;
```

---

## Contact & Support

### Documentation
- Main docs: `README.md`
- Architecture: `ARCHITECTURE.md`
- API docs: `API_DOCUMENTATION.md`

### Issues
Report bugs or request features via GitHub Issues with label `dataset-management`.

### Code Owners
- Frontend: `@frontend-team`
- State Management: `@state-management-team`
- Testing: `@qa-team`

---

*Last Updated: 2025-11-18*
*Version: 1.0.0*
