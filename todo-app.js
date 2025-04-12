function todoApp() {
    return {
      // State
      darkMode: false,
      tasks: [],
      newTask: { 
        description: '', 
        priority: 'medium', 
        dueDate: '', 
        recurring: '', 
        notes: '', 
        attachments: [], 
        subtasks: [], 
        comments: [] 
      },
      filter: 'all',
      searchQuery: '',
      lastDeleted: null,
      draggedIndex: null,

      // Lifecycle methods
      init() {
        this.loadTheme();
        this.loadTasks();
      },

      // Theme handling
      loadTheme() {
        this.darkMode = localStorage.getItem('darkMode') === 'true';
        this.applyTheme();
      },

      toggleTheme() {
        this.darkMode = !this.darkMode;
        localStorage.setItem('darkMode', this.darkMode);
        this.applyTheme();
      },

      applyTheme() {
        document.documentElement.classList.toggle('dark', this.darkMode);
      },

      // Task management
      loadTasks() {
        try {
          const savedTasks = localStorage.getItem('tasks');
          this.tasks = savedTasks ? JSON.parse(savedTasks) : [];
        } catch (e) {
          console.error("Error loading tasks:", e);
          this.tasks = [];
        }
      },

      saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
      },

      addTask() {
        if (!this.newTask.description.trim()) return;
        
        const task = {
          id: Date.now(),
          description: this.newTask.description.trim(),
          priority: this.newTask.priority,
          dueDate: this.newTask.dueDate,
          recurring: this.newTask.recurring,
          notes: this.newTask.notes.trim(),
          attachments: [],
          subtasks: [],
          comments: [],
          completed: false,
          editing: false,
          showDetails: false
        };
        
        this.tasks.push(task);
        this.resetNewTask();
        this.saveTasks();
      },

      resetNewTask() {
        this.newTask = { 
          description: '', 
          priority: 'medium', 
          dueDate: '', 
          recurring: '', 
          notes: '', 
          attachments: [], 
          subtasks: [], 
          comments: [] 
        };
      },

      deleteTask(index) {
        this.lastDeleted = { task: this.tasks[index], index: index };
        this.tasks.splice(index, 1);
        this.saveTasks();
      },

      undoDelete() {
        if (!this.lastDeleted) return;
        
        this.tasks.splice(this.lastDeleted.index, 0, this.lastDeleted.task);
        this.lastDeleted = null;
        this.saveTasks();
      },

      clearCompleted() {
        if (!this.hasCompletedTasks) return;
        
        this.tasks = this.tasks.filter(task => !task.completed);
        this.lastDeleted = null;
        this.saveTasks();
      },

      // Inline editing
      enableEdit(task, index) {
        task.editing = true;
        this.$nextTick(() => {
          if (this.$refs.editInputs && this.$refs.editInputs[index]) {
            this.$refs.editInputs[index].focus();
          }
        });
      },

      disableEdit(task) {
        task.editing = false;
        task.description = task.description.trim();
        this.saveTasks();
      },

      // Details panel
      toggleDetails(task) {
        task.showDetails = !task.showDetails;
      },

      // Drag and drop
      dragTask(event, index) {
        this.draggedIndex = index;
        event.dataTransfer.effectAllowed = 'move';
        event.target.classList.add('dragging');
      },

      dropTask(event) {
        if (this.draggedIndex === null) return;
        
        const task = this.tasks.splice(this.draggedIndex, 1)[0];
        const dropIndex = this.getDropIndex(event);
        this.tasks.splice(dropIndex, 0, task);
        this.draggedIndex = null;
        this.saveTasks();
      },

      getDropIndex(event) {
        const elements = this.$refs.taskList.children;
        for (let i = 0; i < elements.length; i++) {
          const rect = elements[i].getBoundingClientRect();
          if (event.clientY < rect.top + rect.height / 2) {
            return i;
          }
        }
        return this.tasks.length;
      },

      // Import/Export
      exportTasks() {
        const dataStr = JSON.stringify(this.tasks, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'tasks.json';
        link.click();
        URL.revokeObjectURL(url);
      },

      // File input trigger
      triggerFileInput() {
        document.getElementById('fileInput').click();
      },

      // Import tasks from file
      importTasks(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importedTasks = JSON.parse(e.target.result);
            if (Array.isArray(importedTasks)) {
              this.tasks = importedTasks;
              this.saveTasks();
            } else {
              this.showError('Invalid file format');
            }
          } catch (error) {
            this.showError('Error reading file');
          }
        };
        reader.readAsText(file);
      },

      // Utilities
      showError(message) {
        alert(message);
      },

      formatDate(dateString) {
        if (!dateString) return '';
        
        try {
          const date = new Date(dateString);
          return date.toLocaleDateString();
        } catch (e) {
          return dateString;
        }
      },

      // Subtasks management
      addSubtask(task) {
        if (!task.newSubtask || !task.newSubtask.trim()) return;
        
        if (!task.subtasks) task.subtasks = [];
        task.subtasks.push({
          id: Date.now(),
          description: task.newSubtask.trim(),
          completed: false
        });
        
        task.newSubtask = '';
        this.saveTasks();
      },

      removeSubtask(task, index) {
        task.subtasks.splice(index, 1);
        this.saveTasks();
      },

      // Comments management
      addComment(task) {
        if (!task.newComment || !task.newComment.trim()) return;
        
        if (!task.comments) task.comments = [];
        task.comments.push({
          id: Date.now(),
          text: task.newComment.trim(),
          timestamp: new Date().toLocaleString()
        });
        
        task.newComment = '';
        this.saveTasks();
      },

      removeComment(task, index) {
        task.comments.splice(index, 1);
        this.saveTasks();
      },

      // Attachments
      addAttachment(task, event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
          if (!task.attachments) task.attachments = [];
          task.attachments.push({
            id: Date.now(),
            name: file.name,
            data: e.target.result
          });
          
          this.saveTasks();
        };
        reader.readAsDataURL(file);
      },

      // Computed properties
      get filteredTasks() {
        let filtered = this.tasks;
        
        // Filter by completion status
        if (this.filter === 'active') {
          filtered = filtered.filter(task => !task.completed);
        } else if (this.filter === 'completed') {
          filtered = filtered.filter(task => task.completed);
        }
        
        // Filter by search query
        const query = this.searchQuery.trim().toLowerCase();
        if (query) {
          filtered = filtered.filter(task => 
            task.description.toLowerCase().includes(query) ||
            (task.notes && task.notes.toLowerCase().includes(query))
          );
        }
        
        return filtered;
      },
      
      get hasCompletedTasks() {
        return this.tasks.some(task => task.completed);
      }
    };
  }