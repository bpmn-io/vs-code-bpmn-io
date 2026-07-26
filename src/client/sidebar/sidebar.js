// src/client/sidebar/sidebar.js

/**
 * BPMN.flex Sidebar
 *
 * Provides a theme-aware properties panel with:
 * - Header toolbar (language switcher + close button)
 * - Resizable panel via drag handle
 * - Root elements (Process, Collaboration) browser
 * - Dynamic custom properties form with collapsible groups
 * - Input validation with inline error display
 */

import { customTranslations } from '../i18n/customTranslations.js';

export default class Sidebar {
  constructor(options) {
    this.container = options.container || document.body;
    this._rootElements = [];
    this._selectedRootElement = null;
    this._onRootElementSelected = null;
    this._onLanguageChange = null;
    this._onSelectOnCanvas = null;
    this._onRefreshConfig = null;
    this._currentLang = 'en';
  }

  /**
   * Translate a key with optional replacements.
   * @param {string} key - Translation key
   * @param {Object} [replacements] - Key/value pairs for {placeholder} substitution
   * @returns {string}
   */
  _t(key, replacements) {
    var dict = customTranslations[this._currentLang] || customTranslations.en;
    var text = dict[key] || key;
    if (replacements) {
      Object.keys(replacements).forEach(function(k) {
        text = text.replace('{' + k + '}', replacements[k]);
      });
    }
    return text;
  }

  /**
   * Register callback when a root element is selected from the sidebar.
   * @param {function} callback - Called with (rootElement)
   */
  onRootElementSelected(callback) {
    this._onRootElementSelected = callback;
  }

  /**
   * Register callback when a canvas element should be selected.
   * Called when user clicks on a participant child item to locate it.
   * @param {function} callback - Called with (elementId)
   */
  onSelectOnCanvas(callback) {
    this._onSelectOnCanvas = callback;
  }

  /**
   * Register callback when the refresh config button is clicked.
   * @param {function} callback
   */
  onRefreshConfig(callback) {
    this._onRefreshConfig = callback;
  }

  /**
   * Register callback when language is changed.
   * @param {function} callback - Called with (langCode)
   */
  onLanguageChange(callback) {
    this._onLanguageChange = callback;
  }

  /**
   * Set the current language (to update active indicator).
   * @param {string} langCode
   */
  setLanguage(langCode) {
    this._currentLang = langCode;

    // Update language button active indicator
    const opts = document.querySelectorAll('.lang-option');
    opts.forEach(function(opt) {
      opt.classList.toggle('active', opt.getAttribute('data-lang') === langCode);
    });

    // Update header button label
    const btn = document.getElementById('lang-btn');
    if (btn) {
      const active = document.querySelector('.lang-option.active');
      btn.childNodes[0].textContent = active ? active.textContent.replace(' ✓', '') : 'EN';
    }

    // Refresh translatable UI elements
    this._refreshTranslatableUI();

    // Rebuild the root elements tree with translated strings
    if (this._rootElements.length > 0) {
      var selectedId = this._selectedRootElement ? this._selectedRootElement.id : null;
      this.setRootElements(this._rootElements, selectedId);
    }

    // Update empty state text if no selection
    if (!this._selectedRootElement) {
      this._updateEmptyState();
    }
  }

  /**
   * Initialize the sidebar DOM and wire up events.
   */
  init() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    const html =
      '<div id="editor-container">' +
      '  <div id="canvas"></div>' +
      '  <div id="sidebar">' +
      '    <div id="sidebar-resize-handle" title="' + self._t('sidebar.dragToResize') + '"></div>' +
      '    <button id="sidebar-collapse-btn" title="' + self._t('sidebar.hidePanel') + '">' +
               self._iconChevron('right') +
      '    </button>' +
      '    <div id="sidebar-inner">' +

      // ── Header ──
      '      <div id="sidebar-header">' +
      '' +
      '      <button id="lang-btn" class="sb-btn" title="' + self._t('sidebar.language') + '">EN <span class="lang-arrow">▾</span></button>' +
      '      <div id="lang-dropdown">' +
      '        <button class="lang-option" data-lang="ja">日本語</button>' +
      '        <button class="lang-option" data-lang="zh">中文</button>' +
      '        <button class="lang-option active" data-lang="en">English</button>' +
      '      </div>' +
      '      <button id="refresh-config-btn" class="sb-btn" title="' + self._t('sidebar.refreshConfig') + '">' +
                 self._iconRefresh() +
      '      </button>' +
      '      <button id="sidebar-close-btn" class="sb-btn" title="' + self._t('sidebar.hidePanel') + '">' +
                 self._iconX() +
      '      </button>' +
      '    </div>' +

      // ── Scrollable content ──
      '    <div id="sidebar-content">' +
      '      <div id="root-elements-section" class="sb-section">' +
      '        <div class="sb-section-header" id="root-section-toggle">' +
      '          <span class="sb-section-title" data-i18n="sidebar.rootElements">' + self._t('sidebar.rootElements') + '</span>' +
      '          <span class="sb-section-toggle">▾</span>' +
      '        </div>' +
      '        <div class="sb-section-body">' +
      '          <ul id="root-elements-list"></ul>' +
      '        </div>' +
      '      </div>' +
      '      <div id="custom-properties-section" class="sb-section">' +
      '        <div class="sb-section-header" id="props-section-toggle">' +
      '          <span class="sb-section-title">' + self._t('sidebar.propertyDetails') + '</span>' +
      '          <span class="sb-section-toggle">▾</span>' +
      '        </div>' +
      '        <div class="sb-section-body" id="custom-properties-content">' +
      '          <div class="properties-empty-state">' +
      '            <span class="empty-icon">📋</span>' +
      '            <div class="empty-title" data-i18n="sidebar.noSelection">' + self._t('sidebar.noSelection') + '</div>' +
      '            <div class="empty-desc" data-i18n="sidebar.noSelection.desc">' + self._t('sidebar.noSelection.desc').replace(/\n/g, '<br>') + '</div>' +
      '          </div>' +
      '        </div>' +
      '      </div>' +
      '    </div>' +

      // ── Status bar ──
      '    <div id="sidebar-statusbar">' +
      '      <span id="statusbar-info"></span>' +
      '      </div>' +
      '    </div>' +
      '  </div>' +
      '</div>';

    this.container.insertAdjacentHTML('afterbegin', html);

    // Cache DOM refs
    this.sidebar = document.getElementById('sidebar');
    this.customPropertiesContent = document.getElementById('custom-properties-content');
    this.customPropertiesSection = document.getElementById('custom-properties-section');
    this.langBtn = document.getElementById('lang-btn');
    this.langDropdown = document.getElementById('lang-dropdown');
    this.refreshBtn = document.getElementById('refresh-config-btn');
    this.rootElementsList = document.getElementById('root-elements-list');
    this.rootElementsSection = document.getElementById('root-elements-section');
    this.statusbarInfo = document.getElementById('statusbar-info');
    this.collapseBtn = document.getElementById('sidebar-collapse-btn');

    // Initial state: sidebar expanded (user can see the new design)
    // Change to 'collapsed' if you prefer it hidden by default
    this.sidebar.classList.remove('collapsed');

    // Toggle sidebar (collapse button on edge)
    document.getElementById('sidebar-collapse-btn').addEventListener('click', function() {
      self._toggleSidebar();
    });

    // Close button in header
    document.getElementById('sidebar-close-btn').addEventListener('click', function() {
      if (!self.sidebar.classList.contains('collapsed')) {
        self._collapseSidebar();
      }
    });

    // Language dropdown
    this.langBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      const isOpen = self.langDropdown.classList.toggle('open');
      self.langBtn.classList.toggle('open', isOpen);
    });

    this.langDropdown.querySelectorAll('.lang-option').forEach(function(opt) {
      opt.addEventListener('click', function(e) {
        e.stopPropagation();
        const lang = opt.getAttribute('data-lang');
        self.setLanguage(lang);
        self.langDropdown.classList.remove('open');
        self.langBtn.classList.remove('open');
        if (self._onLanguageChange) {
          self._onLanguageChange(lang);
        }
      });
    });

    document.addEventListener('click', function() {
      self.langDropdown.classList.remove('open');
      self.langBtn.classList.remove('open');
    });

    // Refresh config button
    this.refreshBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      self._spinRefreshBtn();
      if (self._onRefreshConfig) {
        self._onRefreshConfig();
      }
    });

    // Root elements section toggle
    document.getElementById('root-section-toggle').addEventListener('click', function() {
      self.rootElementsSection.classList.toggle('collapsed');
    });

    // Properties section toggle
    document.getElementById('props-section-toggle').addEventListener('click', function() {
      self.customPropertiesSection.classList.toggle('collapsed');
    });

    // Initially hide the root elements section (shown when elements exist)
    this.rootElementsSection.style.display = 'none';

    // Resize handle
    this._initResizeHandle();
  }

  /**
   * Toggle sidebar between collapsed and expanded states.
   */
  _toggleSidebar() {
    const wasCollapsed = this.sidebar.classList.contains('collapsed');
    if (wasCollapsed) {
      this._expandSidebar();
    } else {
      this._collapseSidebar();
    }
  }

  _expandSidebar() {
    this.sidebar.classList.remove('collapsed');
    this._updateCollapseBtnIcon();
    const savedWidth = this._loadWidth();
    if (savedWidth) {
      this.sidebar.style.width = savedWidth + 'px';
    }
  }

  _collapseSidebar() {
    const currentWidth = parseInt(this.sidebar.style.width, 10) || this.sidebar.offsetWidth;
    if (currentWidth > 40) {
      this._saveWidth(currentWidth);
    }
    this.sidebar.style.width = '';
    this.sidebar.classList.add('collapsed');
    this._updateCollapseBtnIcon();
  }

  /**
   * Update collapse button chevron: ▸ when expanded (hint: collapse right),
   * ◂ when collapsed (hint: expand left).
   */
  _updateCollapseBtnIcon() {
    if (!this.collapseBtn) return;
    var collapsed = this.sidebar.classList.contains('collapsed');
    this.collapseBtn.innerHTML = this._iconChevron(collapsed ? 'left' : 'right');
  }

  /**
   * Set up the resize handle for drag-to-resize functionality.
   */
  _initResizeHandle() {
    const resizeHandle = document.getElementById('sidebar-resize-handle');
    if (!resizeHandle) return;

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    let startX = 0;
    let startWidth = 0;
    let dragging = false;

    const savedWidth = self._loadWidth();
    if (savedWidth) {
      self.sidebar.style.width = savedWidth + 'px';
    }

    resizeHandle.addEventListener('mousedown', function(e) {
      if (self.sidebar.classList.contains('collapsed')) return;
      e.preventDefault();
      e.stopPropagation();
      dragging = true;
      startX = e.clientX;
      startWidth = self.sidebar.offsetWidth;
      document.body.classList.add('sidebar-resizing');
      resizeHandle.classList.add('active');
    });

    document.addEventListener('mousemove', function(e) {
      if (!dragging) return;
      const deltaX = startX - e.clientX;
      let newWidth = startWidth + deltaX;
      const containerWidth = self.container.offsetWidth;
      const minWidth = 240;
      const maxWidth = Math.max(minWidth, containerWidth * 0.6);
      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      self.sidebar.style.width = newWidth + 'px';
      self.sidebar.style.transition = 'none';
    });

    document.addEventListener('mouseup', function() {
      if (!dragging) return;
      dragging = false;
      document.body.classList.remove('sidebar-resizing');
      resizeHandle.classList.remove('active');
      self.sidebar.style.transition = '';
      const finalWidth = parseInt(self.sidebar.style.width, 10);
      self._saveWidth(finalWidth);
    });
  }

  /**
   * Populate the root elements list as a tree reflecting the BPMN hierarchy.
   *
   * In BPMN 2.0: Participant ↔ Process is 1-to-1 (each pool references exactly
   * one process; a process is referenced by at most one pool).
   *
   * Tree structure:
   * ```
   * Collaboration (N pools)
   *   ├─ 🏊 Pool A         ← click → select pool on canvas
   *   │   └─ ⚙ Process_A   ← click → process properties + highlight pool
   *   ├─ 🏊 Pool B
   *   │   └─ ⚙ Process_B
   *   └─ ...
   * ─────────────────────   ← separator (if standalone processes exist)
   * ⚙ Standalone Process    ← processes with no pool
   * ```
   *
   * @param {Array<{id: string, type: string, name: string, moddleElement: Object,
   *   participantCount?: number, participants?: Array, participantId?: string,
   *   participantName?: string, isStandalone?: boolean}>} rootElements
   */
  setRootElements(rootElements, selectedId) {
    this._rootElements = rootElements || [];

    if (!this.rootElementsList || !this.rootElementsSection) return;

    this.rootElementsList.innerHTML = '';

    if (this._rootElements.length === 0) {
      this.rootElementsSection.style.display = 'none';

      // Clear stale selection if tree is now empty
      if (this._selectedRootElement) {
        this._selectedRootElement = null;
        this._updateStatusbar('');
      }
      return;
    }

    this.rootElementsSection.style.display = 'block';

    // Separate collaborations and processes
    var collaborations = this._rootElements.filter(function(re) {
      return re.type === 'bpmn:Collaboration';
    });
    var allProcesses = this._rootElements.filter(function(re) {
      return re.type === 'bpmn:Process';
    });

    // Build a lookup: processId → process object for quick access
    var processById = {};
    allProcesses.forEach(function(p) {
      processById[p.id] = p;
    });

    // Track which processes are shown under collaboration participants
    var shownProcessIds = {};

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    // ── Render collaboration tree ──────────────────────
    collaborations.forEach(function(re) {

      // Collaboration header
      var collLi = self._createRootItem(re, true);
      self.rootElementsList.appendChild(collLi);

      if (re.participants && re.participants.length > 0) {
        re.participants.forEach(function(part) {

          // ── Participant (Pool) ──
          var partLi = document.createElement('li');
          partLi.className = 'root-element-item root-tree-participant';
          partLi.setAttribute('data-root-id', part.id);
          partLi.title = self._t('sidebar.participant.tooltip', {
            name: part.name || part.id
          });

          var partName = document.createElement('span');
          partName.className = 'root-tree-name';
          partName.textContent = part.name || part.id;

          partLi.appendChild(partName);

          partLi.addEventListener('click', function(e) {
            e.stopPropagation();
            self._selectTreeItem(partLi);
            self._trySelectOnCanvas(part.id);
          });

          self.rootElementsList.appendChild(partLi);

          // ── Process (child of participant) ──
          if (part.processId && processById[part.processId]) {
            shownProcessIds[part.processId] = true;
            var proc = processById[part.processId];

            var procLi = document.createElement('li');
            procLi.className = 'root-element-item root-tree-process';
            procLi.setAttribute('data-root-id', proc.id);

            var procTooltipKey;
            if (proc.participantName) {
              procTooltipKey = 'sidebar.process.tooltip.withPool';
            } else if (proc.isStandalone) {
              procTooltipKey = 'sidebar.process.tooltip.standalone';
            } else {
              procTooltipKey = 'sidebar.process.tooltip.generic';
            }
            procLi.title = self._t(procTooltipKey, {
              name: proc.name || proc.id,
              pool: proc.participantName || ''
            });

            var procName = document.createElement('span');
            procName.className = 'root-tree-name';
            procName.textContent = proc.name || proc.id;

            procLi.appendChild(procName);

            procLi.addEventListener('click', function(e) {
              e.stopPropagation();
              self._selectTreeItem(procLi);
              self._selectedRootElement = proc;
              self._updateStatusbar(self._t('sidebar.process.tooltip.generic', { name: proc.name || proc.id }).split('\n')[0]);
              if (self._onRootElementSelected) {
                self._onRootElementSelected(proc);
              }
            });

            self.rootElementsList.appendChild(procLi);
          }
        });
      }
    });

    // ── Standalone processes (not shown under any participant) ──
    var standaloneProcesses = allProcesses.filter(function(p) {
      return !shownProcessIds[p.id];
    });

    if (standaloneProcesses.length > 0) {

      // Only show separator if there were collaborations above
      if (collaborations.length > 0) {
        var sep = document.createElement('li');
        sep.className = 'root-elements-separator';
        self.rootElementsList.appendChild(sep);
      }

      standaloneProcesses.forEach(function(p) {
        var procLi = self._createRootItem(p, false);
        self.rootElementsList.appendChild(procLi);
      });
    }

    // ── Restore previous selection (by ID) after tree rebuild ──
    if (selectedId) {
      self._restoreSelectionById(selectedId);
    }
  }

  /**
   * Mark a tree item as selected, deselecting the previous one.
   * @param {HTMLElement} li - The list item to select
   */
  _selectTreeItem(li) {
    var prev = this.rootElementsList.querySelector('.root-element-item.selected');
    if (prev) prev.classList.remove('selected');
    li.classList.add('selected');
  }

  /**
   * After rebuilding the tree, try to re-select the previously selected
   * root element by its ID. Updates `_selectedRootElement` to point to
   * the fresh object from the new tree data.
   *
   * @param {string} id - The ID of the root element to re-select
   */
  _restoreSelectionById(id) {

    // Find the fresh data object in the new _rootElements array
    var freshData = null;

    // Search collaborations
    for (var i = 0; i < this._rootElements.length; i++) {
      var re = this._rootElements[i];
      if (re.id === id) {
        freshData = re;
        break;
      }

      // Also search nested participants for processes
      if (re.type === 'bpmn:Collaboration' && re.participants) {
        for (var j = 0; j < re.participants.length; j++) {
          if (re.participants[j].id === id) {

            // Participant: select on canvas instead
            this._trySelectOnCanvas(id);
            return;
          }
        }
      }
    }

    if (freshData) {

      // Update the stored reference to the fresh object
      this._selectedRootElement = freshData;
      this._updateStatusbar(freshData.type.replace('bpmn:', '') + ' · ' + (freshData.name || freshData.id));

      // Visually re-select the DOM element
      var li = this.rootElementsList.querySelector('[data-root-id="' + id + '"]');
      if (li) {
        this._selectTreeItem(li);
      }
    } else {

      // Element no longer exists — clear stale selection
      this._selectedRootElement = null;
      this._updateStatusbar('');
    }
  }

  /**
   * Create a root element list item.
   * @param {Object} re - Root element data
   * @param {boolean} isCollaboration - Whether this is a collaboration
   * @returns {HTMLElement}
   */
  _createRootItem(re, isCollaboration) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    var li = document.createElement('li');
    li.className = 'root-element-item';
    li.setAttribute('data-root-id', re.id);
    li.setAttribute('data-type', re.type);

    var typeBadge = document.createElement('span');
    typeBadge.className = 'root-element-type-badge';

    var typeLabel = re.type.replace('bpmn:', '');
    if (isCollaboration) {
      typeBadge.textContent = typeLabel;
      var collKey = re.name ? 'sidebar.collaboration.tooltip' : 'sidebar.collaboration.tooltip.noName';
      li.title = self._t(collKey, {
        name: re.name || '',
        count: re.participantCount || 0
      });
    } else {
      typeBadge.textContent = typeLabel;

      // Build tooltip with relationship info
      var tooltipKey;
      var tooltipReplacements = { name: re.name || re.id };
      if (re.participantName) {
        tooltipKey = 'sidebar.process.tooltip.withPool';
        tooltipReplacements.pool = re.participantName;
      } else if (re.isStandalone) {
        tooltipKey = 'sidebar.process.tooltip.standalone';
      } else {
        tooltipKey = 'sidebar.process.tooltip.generic';
      }
      li.title = self._t(tooltipKey, tooltipReplacements);
    }

    var nameSpan = document.createElement('span');
    nameSpan.className = 'root-element-name';
    nameSpan.textContent = re.name || re.id;

    // Order: name → badge → count
    li.appendChild(nameSpan);
    li.appendChild(typeBadge);

    // For collaboration, show pool count after badge
    if (isCollaboration && re.participantCount !== undefined) {
      var countSpan = document.createElement('span');
      countSpan.className = 'root-element-relation';
      countSpan.textContent = self._t('sidebar.poolCount', { count: re.participantCount });
      li.appendChild(countSpan);
    }

    // For processes, add pool association indicator
    var relationSpan = null;
    if (!isCollaboration && re.participantName) {
      relationSpan = document.createElement('span');
      relationSpan.className = 'root-element-relation';
      relationSpan.textContent = '↳ ' + re.participantName;
      relationSpan.title = self._t('sidebar.associatedPool') + ': ' + re.participantName;
    } else if (!isCollaboration && re.isStandalone) {
      relationSpan = document.createElement('span');
      relationSpan.className = 'root-element-relation standalone';
      relationSpan.textContent = '— ' + self._t('sidebar.standalone');
    }

    if (relationSpan) {
      li.appendChild(relationSpan);
    }

    li.addEventListener('click', function() {
      var prev = self.rootElementsList.querySelector('.root-element-item.selected');
      if (prev) prev.classList.remove('selected');
      li.classList.add('selected');
      self._selectedRootElement = re;
      self._updateStatusbar(re.type.replace('bpmn:', '') + ' · ' + (re.name || re.id));
      if (self._onRootElementSelected) {
        self._onRootElementSelected(re);
      }
    });

    return li;
  }

  /**
   * Try to select a visual element on the BPMN canvas.
   * Used when clicking on a participant child item.
   * Communicates back through the extension host.
   *
   * @param {string} elementId - The BPMN element ID to select
   */
  _trySelectOnCanvas(elementId) {
    if (this._onSelectOnCanvas) {
      this._onSelectOnCanvas(elementId);
    }
  }

  clearRootElementSelection() {
    this._selectedRootElement = null;
    if (this.rootElementsList) {
      const prev = this.rootElementsList.querySelector('.root-element-item.selected');
      if (prev) prev.classList.remove('selected');
    }
    this._updateStatusbar('');
  }

  getSelectedRootElement() {
    return this._selectedRootElement;
  }

  _updateStatusbar(text) {
    if (this.statusbarInfo) {
      this.statusbarInfo.textContent = text;
    }
  }

  /**
   * Update the custom properties form.
   * @param {Array|string} properties - Property definitions or raw HTML string
   * @param {function} onUpdate - Callback when a property value changes
   */
  updateCustomProperties(properties, onUpdate) {
    if (!this.customPropertiesContent) return;

    // String mode: raw HTML
    if (typeof properties === 'string') {
      this.customPropertiesContent.innerHTML = properties;
      return;
    }

    // Build form
    this.customPropertiesContent.innerHTML = '';

    if (!properties || properties.length === 0) {
      this.customPropertiesContent.innerHTML =
        '<div class="properties-empty-state">' +
        '  <span class="empty-icon">📋</span>' +
        '  <div class="empty-title">' + this._t('sidebar.noProperties') + '</div>' +
        '  <div class="empty-desc">' + this._t('sidebar.noProperties.desc') + '</div>' +
        '</div>';
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    // Render properties as flat rows (no grouping)
    properties.forEach(function(prop) {
      const row = document.createElement('div');
      row.className = 'prop-row';

      // Label
      const label = document.createElement('label');
      label.className = 'prop-label';
      label.textContent = prop.label;

      if (prop._error) {
        const errorBadge = document.createElement('span');
        errorBadge.className = 'prop-error-badge';
        errorBadge.textContent = '⚠';
        errorBadge.title = prop._error;
        label.appendChild(errorBadge);
      }
      row.appendChild(label);

      // Input
      const input = self._createInput(prop, onUpdate);
      row.appendChild(input);

      self.customPropertiesContent.appendChild(row);
    });
  }

  _createInput(prop, onUpdate) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const pd = prop.propDef || {};
    const type = pd.inputType || pd.type;
    let input;

    switch (type) {
    case 'elementText':
      input = document.createElement('textarea');
      input.rows = 4;
      input.className = 'prop-input';
      break;
    case 'date':
      input = document.createElement('input');
      input.type = 'date';
      input.className = 'prop-input';
      break;
    case 'number':
      input = document.createElement('input');
      input.type = 'number';
      if (pd.min !== undefined) input.min = String(pd.min);
      if (pd.max !== undefined) input.max = String(pd.max);
      if (pd.step !== undefined) input.step = String(pd.step);
      input.className = 'prop-input';
      break;
    case 'boolean':
      input = document.createElement('select');
      input.className = 'prop-input';
      input.appendChild(self._option(self._t('sidebar.boolean.true'), 'true'));
      input.appendChild(self._option(self._t('sidebar.boolean.false'), 'false'));
      break;
    default:
      input = document.createElement('input');
      input.type = 'text';
      input.className = 'prop-input';
    }

    // Set value
    if (type === 'boolean') {
      if (prop.value === '1' || prop.value === '0') {
        input.options[0].value = '1';
        input.options[1].value = '0';
        input.value = prop.value;
      } else {
        input.value = String(prop.value) === 'true' ? 'true' : 'false';
      }
    } else {
      input.value = prop.value != null ? prop.value : '';
    }

    // Event handlers
    if (onUpdate && pd.type) {
      input.addEventListener('change', function(e) {
        const validation = self._validateInput(pd, e.target.value);
        if (!validation.valid) {
          self._showInputError(e.target, validation.error);
          e.target.value = prop.value;
          return;
        }
        self._clearInputError(e.target);
        onUpdate(pd, e.target.value);
      });

      input.addEventListener('input', function(e) {
        const validation = self._validateInput(pd, e.target.value);
        if (validation.valid) {
          self._clearInputError(e.target);
        }
      });
    } else {
      input.disabled = true;
    }

    return input;
  }

  _option(text, value) {
    const opt = document.createElement('option');
    opt.text = text;
    opt.value = value;
    return opt;
  }

  /**
   * Validate input value against property definition.
   * @param {Object} propDef
   * @param {string} value
   * @returns {{valid: boolean, error: string|null}}
   */
  _validateInput(propDef, value) {
    if (!propDef) return { valid: true, error: null };

    const type = propDef.inputType || propDef.type;

    if (type === 'number') {
      if (value !== '' && isNaN(Number(value))) {
        return { valid: false, error: this._t('sidebar.validation.invalidNumber') };
      }
      if (propDef.min !== undefined && Number(value) < Number(propDef.min)) {
        return { valid: false, error: this._t('sidebar.validation.minValue', { min: propDef.min }) };
      }
      if (propDef.max !== undefined && Number(value) > Number(propDef.max)) {
        return { valid: false, error: this._t('sidebar.validation.maxValue', { max: propDef.max }) };
      }
    }

    if (type === 'date') {
      if (value !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return { valid: false, error: this._t('sidebar.validation.invalidDate') };
      }
    }

    return { valid: true, error: null };
  }

  _showInputError(input, message) {
    this._clearInputError(input);
    if (!message) return;

    input.classList.add('input-error');
    const errorEl = document.createElement('span');
    errorEl.className = 'validation-error';
    errorEl.textContent = message;
    input.parentNode.appendChild(errorEl);
  }

  _clearInputError(input) {
    input.classList.remove('input-error');
    const existing = input.parentNode.querySelector('.validation-error');
    if (existing) existing.remove();
  }

  _saveWidth(width) {
    try {
      localStorage.setItem('bpmn-flex.sidebar.width', String(width));
    } catch (_e) { /* noop */ }
  }

  _loadWidth() {
    try {
      const val = localStorage.getItem('bpmn-flex.sidebar.width');
      if (val) {
        const num = parseInt(val, 10);
        if (num >= 200) return num;
      }
    } catch (_e) { /* noop */ }
    return null;
  }

  /**
   * Escape HTML entities in a string.
   * @param {string} str
   * @returns {string}
   */
  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Refresh static translatable UI elements after language change.
   */
  _refreshTranslatableUI() {

    // Section titles
    var titleEls = document.querySelectorAll('.sb-section-title');
    if (titleEls[0]) titleEls[0].textContent = this._t('sidebar.rootElements');
    if (titleEls[1]) titleEls[1].textContent = this._t('sidebar.propertyDetails');

    // Collapse button tooltip
    if (this.collapseBtn) {
      this.collapseBtn.title = this._t('sidebar.hidePanel');
    }

    // Close button tooltip
    var closeBtn = document.getElementById('sidebar-close-btn');
    if (closeBtn) {
      closeBtn.title = this._t('sidebar.hidePanel');
    }

    // Language button tooltip
    if (this.langBtn) {
      this.langBtn.title = this._t('sidebar.language');
    }

    // Refresh config button tooltip
    if (this.refreshBtn) {
      this.refreshBtn.title = this._t('sidebar.refreshConfig');
    }

    // Resize handle tooltip
    var resizeHandle = document.getElementById('sidebar-resize-handle');
    if (resizeHandle) {
      resizeHandle.title = this._t('sidebar.dragToResize');
    }

    // Empty state
    this._updateEmptyState();
  }

  /**
   * Update the empty state placeholder text (when no element is selected).
   */
  _updateEmptyState() {
    var emptyTitle = document.querySelector('#custom-properties-content .empty-title');
    var emptyDesc = document.querySelector('#custom-properties-content .empty-desc');
    if (emptyTitle) {
      emptyTitle.textContent = this._t('sidebar.noSelection');
    }
    if (emptyDesc) {
      emptyDesc.innerHTML = this._t('sidebar.noSelection.desc').replace(/\n/g, '<br>');
    }
  }

  _iconX() {
    return '<svg viewBox="0 0 16 16" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round">' +
           '<line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>';
  }

  _iconRefresh() {
    return '<svg viewBox="0 0 16 16" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round">' +
           '<path d="M2 8a6 6 0 0 1 10.4-4"/>' +
           '<path d="M2 8a6 6 0 0 0 10.4 4"/>' +
           '<polyline points="12.4,4 12.4,2 13.8,3.9"/>' +
           '<polyline points="12.4,12 12.4,14 13.8,12.1"/>' +
           '</svg>';
  }

  /**
   * Show a brief spinning animation on the refresh button.
   */
  _spinRefreshBtn() {
    if (!this.refreshBtn) return;
    this.refreshBtn.classList.add('spinning');
    setTimeout(() => {
      if (this.refreshBtn) {
        this.refreshBtn.classList.remove('spinning');
      }
    }, 600);
  }

  _iconChevron(dir) {
    const pts = dir === 'right' ? '6,3 12,8 6,13' : '10,3 4,8 10,13';
    return '<svg viewBox="0 0 16 16" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round">' +
           '<polyline points="' + pts + '"/></svg>';
  }
}
