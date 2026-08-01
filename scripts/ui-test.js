const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT = path.resolve(__dirname, '..');

// Simple HTTP Server
const server = http.createServer((req, res) => {
  const filePath = path.join(ROOT, req.url === '/' ? 'scripts/mock-webview.html' : req.url);

  const extname = path.extname(filePath);
  let contentType = 'text/html';
  switch (extname) {
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
    case '.json':
      contentType = 'application/json';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.jpg':
      contentType = 'image/jpg';
      break;
    case '.svg':
      contentType = 'image/svg+xml';
      break;
    case '.woff':
    case '.woff2':
      contentType = 'font/woff';
      break;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if(error.code == 'ENOENT'){
        console.log(`File not found: ${filePath}`);
        res.writeHead(404);
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end('500: ' + error.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

const bpmnXML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:custom="http://custom/ns" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1">
      <bpmn:outgoing>SequenceFlow_0b6cm13</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_0zlv465" name="foo" custom:startDate="2023-01-01" custom:priority="5" custom:isActive="true">
      <bpmn:documentation>{"retry": {"count": 3}}</bpmn:documentation>
      <bpmn:incoming>SequenceFlow_0b6cm13</bpmn:incoming>
      <bpmn:outgoing>SequenceFlow_17w8608</bpmn:outgoing>
    </bpmn:task>
    <bpmn:sequenceFlow id="SequenceFlow_0b6cm13" sourceRef="StartEvent_1" targetRef="Task_0zlv465" />
    <bpmn:endEvent id="EndEvent_09arx8f">
      <bpmn:incoming>SequenceFlow_17w8608</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="SequenceFlow_17w8608" sourceRef="Task_0zlv465" targetRef="EndEvent_09arx8f" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="173" y="188" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="146" y="224" width="90" height="20" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_0zlv465_di" bpmnElement="Task_0zlv465">
        <dc:Bounds x="264" y="303" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="SequenceFlow_0b6cm13_di" bpmnElement="SequenceFlow_0b6cm13">
        <di:waypoint xsi:type="dc:Point" x="209" y="206" />
        <di:waypoint xsi:type="dc:Point" x="237" y="206" />
        <di:waypoint xsi:type="dc:Point" x="237" y="343" />
        <di:waypoint xsi:type="dc:Point" x="264" y="343" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="192.5" y="110" width="90" height="20" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNShape id="EndEvent_09arx8f_di" bpmnElement="EndEvent_09arx8f">
        <dc:Bounds x="431" y="102" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="404" y="138" width="90" height="20" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="SequenceFlow_17w8608_di" bpmnElement="SequenceFlow_17w8608">
        <di:waypoint xsi:type="dc:Point" x="364" y="343" />
        <di:waypoint xsi:type="dc:Point" x="398" y="343" />
        <di:waypoint xsi:type="dc:Point" x="398" y="120" />
        <di:waypoint xsi:type="dc:Point" x="431" y="120" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="353.5" y="110" width="90" height="20" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

(async () => {
  server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });

    // Capture messages sent to VS Code
    const sentMessages = [];
    await page.exposeFunction('onPostMessage', msg => {
        console.log('Intercepted message:', msg);
        sentMessages.push(msg);
    });

    console.log('Navigating to app...');
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });

    // Hook into the mock acquireVsCodeApi to redirect messages to our exposed function
    await page.evaluate(() => {
        const originalPostMessage = window.acquireVsCodeApi().postMessage;
        window.acquireVsCodeApi().postMessage = (msg) => {
             window.onPostMessage(msg); // Call puppeteer exposed function
             if (window.postedMessages) window.postedMessages.push(msg);
        };
    });

    // 1. Initial Load (English default)
    console.log('Initializing BPMN...');
    await page.evaluate((xml) => {
      window.postMessage({ type: 'init', body: { content: xml } }, '*');
    }, bpmnXML);

    // Wait for rendering
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ROOT, 'ui-default-en.png') });

    // 2. Switch to Chinese
    console.log('Switching to Chinese...');
    await page.click('#lang-btn');
    await new Promise(r => setTimeout(r, 200));
    await page.click('.lang-option[data-lang="zh"]');
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ROOT, 'ui-chinese.png') });

    // 3. Switch to Japanese
    console.log('Switching to Japanese...');
    await page.click('#lang-btn');
    await new Promise(r => setTimeout(r, 200));
    await page.click('.lang-option[data-lang="ja"]');
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ROOT, 'ui-japanese.png') });

    // 4. Sidebar & Custom Properties
    console.log('Testing Sidebar & Custom Properties...');

    // Inject configuration (new schema: source/control/path/engine/field/format)
    const customConfig = {
      common: [
        { label: 'Documentation', path: 'bpmn:documentation', source: 'text', control: 'textarea' },
        { label: 'Name', path: '@name', source: 'attribute', control: 'text' },
        { label: 'Start Date', path: '@custom:startDate', source: 'attribute', control: 'date' },
        { label: 'Priority', path: '@custom:priority', source: 'attribute', control: 'number' },
        { label: 'Is Active', path: '@custom:isActive', source: 'attribute', control: 'boolean' },
        { label: 'Nested Prop', path: 'custom:nested/custom:val', source: 'attribute', control: 'text' },
        { label: 'Retry Count', path: 'bpmn:documentation', source: 'embedded', format: 'json', field: 'retry.count', control: 'number' }
      ]
    };

    await page.evaluate((config) => {
      window.postMessage({ type: 'customConfig', body: config }, '*');
    }, customConfig);

    // Select the Task
    await page.waitForSelector('[data-element-id="Task_0zlv465"]');
    await page.click('[data-element-id="Task_0zlv465"]');
    await new Promise(r => setTimeout(r, 500));

    // Sidebar is expanded by default — wait for render
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ROOT, 'ui-sidebar-custom-props.png') });
    console.log('Screenshot: ui-sidebar-custom-props.png');

    // 5. Test Editing
    console.log('Testing Editing...');

    // Wait for the properties form to render (Documentation uses textarea control)
    const textareaSelector = '#custom-properties-content textarea';
    await page.waitForSelector(textareaSelector, { timeout: 10000 });

    // Properties render as direct children of #custom-properties-content when no 'group' is specified.
    // Order: Documentation(0), Name(1), Start Date(2), Priority(3), Is Active(4), Nested Prop(5), Retry Count(6)
    // Note: nth-child is 1-indexed in CSS.

    // Update Date (3rd prop-row: Documentation → Name → Start Date)
    const dateInputSelector = '#custom-properties-content > .prop-row:nth-child(3) input';
    await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) throw new Error('Date input not found: ' + sel);
        el.value = '2023-12-31';
        el.dispatchEvent(new Event('change'));
    }, dateInputSelector);

    // Update Number (4th prop-row: Priority)
    const numInputSelector = '#custom-properties-content > .prop-row:nth-child(4) input';
    await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) throw new Error('Number input not found: ' + sel);
        el.value = '99';
        el.dispatchEvent(new Event('change'));
    }, numInputSelector);

    // Update Boolean (5th prop-row: Is Active)
    const boolInputSelector = '#custom-properties-content > .prop-row:nth-child(5) select';
    await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) throw new Error('Boolean select not found: ' + sel);
        el.value = 'false';
        el.dispatchEvent(new Event('change'));
    }, boolInputSelector);

    // Update JSON Number (7th prop-row: Retry Count)
    const jsonInputSelector = '#custom-properties-content > .prop-row:nth-child(7) input';
    await page.waitForSelector(jsonInputSelector, { timeout: 5000 });
    await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) throw new Error('JSON number input not found: ' + sel);
        el.value = '10';
        el.dispatchEvent(new Event('change'));
    }, jsonInputSelector);

    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(ROOT, 'ui-sidebar-edited.png') });
    console.log('Screenshot: ui-sidebar-edited.png');

    // Check if XML updated
    // Request Text
    await page.evaluate(() => {
        window.postMessage({ type: 'getText', requestId: 123 }, '*');
    });

    // Wait for response in sentMessages
    // Simple polling
    let xml = '';
    for(let i=0; i<20; i++) {
        const response = sentMessages.find(m => m.type === 'response' && m.requestId === 123);
        if (response) {
            xml = response.body;
            break;
        }
        await new Promise(r => setTimeout(r, 100));
    }

    let success = true;
    // Documentation check removed as we didn't update it directly

    if (xml.includes('custom:startDate="2023-12-31"')) {
         console.log('SUCCESS: XML contains updated date.');
    } else {
        console.error('FAILURE: XML does not contain updated date. Content:', xml);
        success = false;
    }

    if (xml.includes('custom:priority="99"')) {
         console.log('SUCCESS: XML contains updated priority.');
    } else {
        console.error('FAILURE: XML does not contain updated priority.');
        success = false;
    }

    if (xml.includes('custom:isActive="false"')) {
         console.log('SUCCESS: XML contains updated boolean.');
    } else {
        console.error('FAILURE: XML does not contain updated boolean.');
        success = false;
    }

    // Check JSON update
    // The JSON string should be stringified, possibly with whitespace if pretty printed.
    // We updated 'retry.count' to 10. Initial was 3.
    // The implementation uses JSON.stringify(json, null, 2).
    // Since we set inputType: 'number', customPropsExtractor should cast it to a number.
    // So we look for "count": 10.
    if (xml.includes('"count": 10')) {
         console.log('SUCCESS: XML contains updated JSON value.');
    } else {
         console.error('FAILURE: XML does not contain updated JSON value. XML snippet around documentation:', xml.match(/<bpmn:documentation>[\s\S]*?<\/bpmn:documentation>/)?.[0] || 'Not found');
         success = false;
    }

    if (!success) process.exit(1);

    await browser.close();
    server.close();
  } catch (error) {
    console.error('Test failed:', error);
    server.close();
    process.exit(1);
  }
})();
