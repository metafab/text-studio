# Text Processing Studio

A comprehensive text processing web application built with Svelte, TypeScript, and Vite. Process, compare, transform, and analyze text with an intuitive interface and powerful features.

## 🚀 Features

### Text Processing Operations

- **Text Statistics** - Lines, characters, unique lines with case sensitivity options
- **Sorting** - Ascending, descending, or random line sorting
- **Deduplication** - Remove duplicate lines with case-sensitive/insensitive options
- **Text Transformation** - Uppercase, lowercase, trim whitespace
- **Line Operations** - Reverse lines, remove empty lines, keep top/bottom N lines
- **Text Trimming** - Remove whitespace from start, end, or both sides of lines
- **Line Filtering** - Keep or remove lines based on search patterns with three search modes
- **Text Splitting/Joining** - Split text by custom separators or join lines with separators
- **Prefix/Suffix** - Add text to the beginning or end of each line
- **Substring Extraction** - Extract specific character ranges from each line with 1-based indexing, negative indices, and flexible length options - [Learn more with examples](./docs/SUBSTRING_EXAMPLES.md)
- **Text Insertion** - Insert text at specific positions within each line (1-based or negative indices)
- **Extract Between Delimiters** - Extract text between two delimiters (e.g., `<` and `>`), from a start delimiter to end of line, or from start of line to an end delimiter. Strip option to include or exclude delimiters in results

### Text Comparison & Analysis

- **Side-by-Side Comparison** - Compare two texts in parallel panels
- **Common Lines** - Extract lines that exist in both texts
- **Unique Lines** - Find lines unique to left text, right text, or both
- **Visual Highlighting** - Highlight common or different lines with color coding
- **Search & Highlight** - Three search modes: Standard (exact match), LIKE Pattern (SQL-style wildcards with % and \_), and Regex (full JavaScript regex support) - [Learn more about search modes](./docs/SEARCH_MODES_FEATURE.md)
- **Flexible Filtering** - Keep or remove lines based on search patterns with all three search modes
- **Advanced Replace** - Replace text with support for regex capture groups and LIKE pattern replacements

### User Experience

- **Three-Panel Interface** - Left, Right, and Result panels with resizable layout
- **Output Destination Control** - Choose whether commands output to active panel or result panel
- **Drag & Drop** - Drop text files directly into panels
- **File Operations** - Import, export, copy to clipboard
- **Undo/Redo** - Full history tracking for all panels (Cmd/Ctrl+Z)
- **Theme Support** - Light and dark themes
- **Responsive Design** - Works on desktop and mobile devices
- **Privacy-First** - All processing happens in your browser, no data sent to servers

### Advanced Features

- **Panel Management** - Maximize panels, resize splits, toggle command panel
- **Content Transfer** - Copy content between panels or swap panel contents
- **Concatenation** - Combine multiple texts in different orders
- **Font Customization** - Adjustable font family and size
- **Keyboard Shortcuts** - Efficient navigation and operations (Shift+Click for Result panel, Alt+Click or Option+Click for Active panel)
- **Real-time Stats** - Live character and line counts
- **Case Sensitivity Toggle** - Global setting for all comparison operations

## 🛠️ Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- pnpm (recommended) or npm

### Quick Start

```bash
# Clone the repository
git clone <your-repo-url>
cd text-studio

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## 🧪 Testing

The project includes comprehensive unit tests for all text processing functions and undo/redo functionality.

```bash
# Run tests once
pnpm test:run

# Run tests in watch mode
pnpm test

# Run tests with UI interface
pnpm test:ui
```

For detailed testing information, see [TESTING.md](./docs/TESTING.md).

## 🏗️ Technology Stack

- **Frontend Framework**: Svelte 5 with TypeScript
- **Build Tool**: Vite
- **Testing**: Vitest with jsdom
- **Dependencies**:
  - `@floating-ui/dom` - Tooltip positioning
  - `file-saver` - File download functionality
- **Development**: Hot Module Replacement (HMR), TypeScript checking

For technical details and architecture decisions, see [TECH.md](./docs/TECH.md).

## 📝 Usage Examples

### Basic Text Processing

1. **Load Text**: Paste text or drag & drop a file into the Left panel
2. **Select Operation**: Choose from sorting, deduplication, case conversion, etc.
3. **View Results**: Processed text appears in the active panel or Result panel

### Text Comparison

1. **Load Texts**: Add content to both Left and Right panels
2. **Compare**: Use "Extract Common", "Left Only", or "Right Only" commands
3. **Highlight**: Visualize differences with highlighting commands
4. **Export**: Copy or download results

### Advanced Workflows

- **Multi-step Processing**: Use Result panel as input for further operations
- **Undo/Redo**: Navigate through operation history with keyboard shortcuts
- **Panel Management**: Maximize panels for focus or split view for comparison

## 🎯 Use Cases

- **Data Analysis** - Compare datasets, find unique values, deduplicate records
- **Content Management** - Process lists, clean up text files, format content
- **Development** - Compare configuration files, analyze logs, process data exports
- **Research** - Analyze text samples, extract patterns, compare documents
- **General Text Processing** - Sort lists, clean data, transform formats

## 🔒 Privacy & Security

- **Client-Side Processing** - All operations happen in your browser
- **No Data Transfer** - No text content is sent to external servers
- **Local Storage** - Settings stored locally in browser
- **File Handling** - Files processed entirely in browser memory

## 🤝 Contributing

Consult [UX improvement ideas](./docs/UX_IMPROVEMENTS.md) and [suggestions for new commands](./docs/COMMAND_IDEAS.md).

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and add tests
4. Run tests (`pnpm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is open source. See the [LICENSE](./LICENSE) file for details.

## 🔗 Links

- [Technical Documentation](./docs/TECH.md) - Architecture and implementation details
- [Testing Guide](./docs/TESTING.md) - Test coverage and testing approach
- [Svelte Documentation](https://svelte.dev/docs) - Learn about Svelte
- [Vite Documentation](https://vitejs.dev/) - Build tool documentation

---

Built with ❤️ using Svelte, TypeScript, and Vite
