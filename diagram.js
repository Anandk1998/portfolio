/**
 * ============================================================================
 * LIVE NETWORK TOPOLOGY CANVAS ENGINE
 * Interactive animated network diagram with packet physics, glowing links,
 * and node inspection for Network & Cloud Infrastructure Engineers.
 * ============================================================================
 */

(function () {
  'use strict';

  const canvas = document.getElementById('networkCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stage = document.getElementById('networkCanvasStage');

  // Network Node Metadata & Management Responsibilities
  const NETWORK_NODES = {
    internet: {
      id: 'internet',
      name: 'Internet & Tier-1 Transit Uplinks',
      role: 'PERIMETER WAN & PEERING',
      icon: '🌐',
      state: 'STATUS: ONLINE / 0% PACKET LOSS',
      color: '#38bdf8',
      desc: 'Dual multi-homed BGP peering over Tier-1 transit providers (AS65001). AS-Path prepending, BGP community tagging for traffic engineering, automated DDoS mitigation via Cloudflare Magic Transit, and dual entrance fiber conduit redundancy.',
      platform: 'Cisco ASR 9000 / IOS-XR',
      interfaces: '2x 100G QSFP28 Uplinks',
      throughput: '18.4 Gbps / 40 Gbps max',
      security: 'RPKI Validation, uRPF Strict, BGP FlowSpec',
      cpu: 24,
      mem: 41,
      latency: '1.2 ms',
      tags: ['BGP EVPN', 'Transit AS65001', 'DDoS Scrubbing', 'Dual ISP WAN']
    },
    firewall: {
      id: 'firewall',
      name: 'Next-Gen Firewall Cluster (HA)',
      role: 'SECURITY PERIMETER & INSPECTION',
      icon: '🛡️',
      state: 'STATUS: INSPECTING / ALL POLICIES HEALTHY',
      color: '#f43f5e',
      desc: 'Active/Passive HA Next-Gen Firewall cluster with stateful failover. Enforces deep packet inspection, App-ID, SSL forward decryption, WildFire threat analysis, zero-trust microsegmentation, and dynamic IP reputation blacklisting.',
      platform: 'Palo Alto PA-5250 / PAN-OS 11.x',
      interfaces: '4x 40G QSFP+ Aggregated LACP',
      throughput: '22.1 Gbps threat inspection',
      security: 'SSL Decrypt, IPS/IDS, App-ID, Antivirus',
      cpu: 38,
      mem: 54,
      latency: '2.4 ms',
      tags: ['Palo Alto PA-5250', 'Zero Trust', 'SSL Inspection', 'Active/Passive HA']
    },
    switch: {
      id: 'switch',
      name: 'Core Layer 3 Switch Backbone',
      role: 'DISTRIBUTION & EVPN-VXLAN SPINE',
      icon: '🔀',
      state: 'STATUS: ACTIVE / 40G BACKPLANE OPTIMAL',
      color: '#10b981',
      desc: 'High-density Layer 3 spine switch managing inter-VLAN routing, OSPF backbone area 0, EVPN-VXLAN overlay networks, 802.1Q trunking, and LACP port-channels. Engineered for zero-drop microburst buffer architecture.',
      platform: 'Arista 7280R3 / EOS & Cisco Nexus 9300',
      interfaces: '32x 100G QSFP28 / 48x 25G SFP28',
      throughput: '34.8 Gbps non-blocking switching',
      security: 'Dynamic ARP Inspection, DHCP Snooping, 802.1X',
      cpu: 19,
      mem: 32,
      latency: '0.4 ms',
      tags: ['EVPN-VXLAN', 'OSPF Backbone', 'LACP Port-Channel', '40G/100G Spine']
    },
    servers: {
      id: 'servers',
      name: 'On-Premises Compute & Storage Cluster',
      role: 'HYPERCONVERGED DATACENTER',
      icon: '🖥️',
      state: 'STATUS: OPERATIONAL / 42 NODES HEALTHY',
      color: '#06b6d4',
      desc: 'Clustered hypervisors hosting internal microservices, Kubernetes bare-metal worker nodes with Cilium eBPF CNI, NVMe-oF SAN storage, and Ceph distributed storage fabric across redundant Top-of-Rack (ToR) switches.',
      platform: 'Dell PowerEdge R750 + VMware ESXi / Proxmox',
      interfaces: 'Bonded 2x 25G SFP28 LACP per chassis',
      throughput: '14.2 Gbps east-west intra-cluster',
      security: 'Calico / Cilium NetworkPolicy, SELinux',
      cpu: 52,
      mem: 68,
      latency: '0.3 ms',
      tags: ['Kubernetes Cilium', 'VMware ESXi', 'Bonded 25G', 'Ceph Storage']
    },
    cloud: {
      id: 'cloud',
      name: 'Cloud VPC over Encrypted IPSec VPN',
      role: 'HYBRID MULTI-CLOUD EXTENSION',
      icon: '☁️',
      state: 'STATUS: VPN TUNNEL UP / BGP ESTABLISHED',
      color: '#8b5cf6',
      desc: 'Direct encrypted hybrid cloud connectivity connecting on-premises data centers to AWS Transit Gateway and multi-account VPCs over redundant IPSec IKEv2 / WireGuard tunnels with automated BGP failover in under 2 seconds.',
      platform: 'AWS Transit Gateway / Cloud WAN & WireGuard',
      interfaces: 'Dual Redundant IPSec 2.5 Gbps Tunnels',
      throughput: '4.8 Gbps Encrypted VPN Throughput',
      security: 'AES-256-GCM, SHA-384, Diffie-Hellman Group 20',
      cpu: 28,
      mem: 45,
      latency: '11.8 ms',
      tags: ['AWS Transit Gateway', 'IPSec IKEv2', 'BGP Failover', 'Hybrid VPC Mesh']
    }
  };

  // State
  let width = 0;
  let height = 0;
  let dpr = window.devicePixelRatio || 1;
  let activeNodeId = 'internet';
  let hoveredNodeId = null;
  let animationSpeedMultiplier = 1;
  let packets = [];
  let topologyLinks = [];
  let nodesLayout = [];

  // Initialize Topology Layout Coordinates based on Canvas Size
  function computeLayout() {
    dpr = window.devicePixelRatio || 1;
    const rect = stage.getBoundingClientRect();
    width = rect.width;
    height = rect.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);

    const isMobile = width < 720;

    if (!isMobile) {
      // Desktop / Tablet Horizontal Pipeline Layout
      // 1. Internet (Left) -> 2. Firewall -> 3. Core Switch (Center)
      // -> 4. On-Prem Servers (Bottom-Right) & 5. Cloud VPC (Top-Right over VPN)
      nodesLayout = [
        { id: 'internet', x: width * 0.12, y: height * 0.50, radius: 36 },
        { id: 'firewall', x: width * 0.32, y: height * 0.50, radius: 36 },
        { id: 'switch',   x: width * 0.55, y: height * 0.50, radius: 38 },
        { id: 'servers',  x: width * 0.85, y: height * 0.73, radius: 36 },
        { id: 'cloud',    x: width * 0.85, y: height * 0.27, radius: 38 }
      ];
    } else {
      // Mobile Responsive Compact Diamond / Branch Layout
      nodesLayout = [
        { id: 'internet', x: width * 0.18, y: height * 0.25, radius: 28 },
        { id: 'firewall', x: width * 0.50, y: height * 0.25, radius: 28 },
        { id: 'switch',   x: width * 0.50, y: height * 0.65, radius: 30 },
        { id: 'servers',  x: width * 0.18, y: height * 0.78, radius: 28 },
        { id: 'cloud',    x: width * 0.82, y: height * 0.55, radius: 29 }
      ];
    }

    // Define Network Links with link types
    topologyLinks = [
      {
        from: 'internet',
        to: 'firewall',
        type: 'wan',
        color: '#38bdf8',
        label: '100G WAN Transit',
        protocol: 'eBGP AS65001',
        isVpn: false
      },
      {
        from: 'firewall',
        to: 'switch',
        type: 'firewall',
        color: '#f43f5e',
        label: 'Filtered Inspection LACP',
        protocol: 'Layer 3 Trunk',
        isVpn: false
      },
      {
        from: 'switch',
        to: 'servers',
        type: 'lan',
        color: '#10b981',
        label: '40G Spine-Leaf Fabric',
        protocol: 'EVPN-VXLAN',
        isVpn: false
      },
      {
        from: 'switch',
        to: 'cloud',
        type: 'vpn',
        color: '#8b5cf6',
        label: 'IPSec VPN Tunnel Mesh',
        protocol: 'IKEv2 / BGP',
        isVpn: true
      }
    ];

    // Seed packets along the links
    seedPackets();
  }

  // Seed Continuous Flowing Packets
  function seedPackets() {
    packets = [];
    const countPerLink = 4;

    topologyLinks.forEach((link, linkIdx) => {
      for (let i = 0; i < countPerLink; i++) {
        // Forward flow
        packets.push({
          linkIndex: linkIdx,
          progress: (i / countPerLink),
          speed: 0.0035 + Math.random() * 0.002,
          reverse: false,
          color: link.color,
          size: link.isVpn ? 4.5 : 3.5,
          isBurst: false
        });
        // Return / ACK flow
        packets.push({
          linkIndex: linkIdx,
          progress: ((i + 0.5) / countPerLink),
          speed: 0.0035 + Math.random() * 0.002,
          reverse: true,
          color: link.color,
          size: 3.2,
          isBurst: false
        });
      }
    });
  }

  // Helper: Find node object by ID
  function getNode(id) {
    return nodesLayout.find(n => n.id === id);
  }

  // Draw Network Diagram
  function draw() {
    ctx.clearRect(0, 0, width, height);

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

    // 1. Draw Subtle Tech Grid Background
    drawTechGrid(isDark);

    // 2. Draw Links & Animated Packets
    drawLinks(isDark);
    drawPackets();

    // 3. Draw Nodes (Router, Switch, Firewall, Cloud, Servers)
    drawNodes(isDark);

    // 4. Draw Hover Tooltip if hovering
    if (hoveredNodeId) {
      drawTooltip(hoveredNodeId, isDark);
    }
  }

  // Draw background blueprint grid
  function drawTechGrid(isDark) {
    ctx.save();
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.025)' : 'rgba(0, 0, 0, 0.035)';
    ctx.lineWidth = 1;
    const gridSize = 40;

    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Draw Cables / Links
  function drawLinks(isDark) {
    topologyLinks.forEach(link => {
      const fromNode = getNode(link.from);
      const toNode = getNode(link.to);
      if (!fromNode || !toNode) return;

      const isConnectedToActive = (link.from === activeNodeId || link.to === activeNodeId);
      const isConnectedToHover = (link.from === hoveredNodeId || link.to === hoveredNodeId);

      ctx.save();

      // Draw Link Glow
      if (isConnectedToActive || isConnectedToHover) {
        ctx.strokeStyle = link.color;
        ctx.lineWidth = link.isVpn ? 5 : 6;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        if (link.isVpn) {
          drawCurvedLine(ctx, fromNode.x, fromNode.y, toNode.x, toNode.y, -30);
        } else {
          ctx.moveTo(fromNode.x, fromNode.y);
          ctx.lineTo(toNode.x, toNode.y);
        }
        ctx.stroke();
      }

      // Draw Main Link Line
      ctx.strokeStyle = link.color;
      ctx.lineWidth = link.isVpn ? 2.5 : 3;
      ctx.globalAlpha = isConnectedToActive ? 0.95 : 0.65;

      if (link.isVpn) {
        // Dashed encrypted tunnel styling
        ctx.setLineDash([7, 5]);
        ctx.beginPath();
        drawCurvedLine(ctx, fromNode.x, fromNode.y, toNode.x, toNode.y, -30);
        ctx.stroke();
      } else {
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.stroke();
      }

      // Draw Link Midpoint Protocol Badge (on larger screens)
      if (width > 600) {
        let midX, midY;
        if (link.isVpn) {
          const pt = getQuadraticBezierPoint(fromNode.x, fromNode.y, toNode.x, toNode.y, -30, 0.5);
          midX = pt.x;
          midY = pt.y;
        } else {
          midX = (fromNode.x + toNode.x) / 2;
          midY = (fromNode.y + toNode.y) / 2;
        }

        drawLinkBadge(midX, midY, link.protocol, link.color, isDark);
      }

      ctx.restore();
    });
  }

  // Draw link protocol pill badge
  function drawLinkBadge(x, y, text, color, isDark) {
    ctx.save();
    ctx.font = '500 10px "JetBrains Mono", monospace';
    const textWidth = ctx.measureText(text).width;
    const paddingX = 8;
    const pillWidth = textWidth + paddingX * 2;
    const pillHeight = 18;

    ctx.fillStyle = isDark ? '#0c111e' : '#ffffff';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x - pillWidth / 2, y - pillHeight / 2, pillWidth, pillHeight, 9);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isDark ? '#cbd5e1' : '#334155';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  // Helper for curved VPN line
  function drawCurvedLine(context, x1, y1, x2, y2, curveOffset) {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    // Orthogonal normal vector
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const normX = -dy / len;
    const normY = dx / len;

    const ctrlX = midX + normX * curveOffset;
    const ctrlY = midY + normY * curveOffset;

    context.moveTo(x1, y1);
    context.quadraticCurveTo(ctrlX, ctrlY, x2, y2);
  }

  function getQuadraticBezierPoint(x1, y1, x2, y2, curveOffset, t) {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const normX = -dy / len;
    const normY = dx / len;
    const ctrlX = midX + normX * curveOffset;
    const ctrlY = midY + normY * curveOffset;

    const u = 1 - t;
    const px = u * u * x1 + 2 * u * t * ctrlX + t * t * x2;
    const py = u * u * y1 + 2 * u * t * ctrlY + t * t * y2;
    return { x: px, y: py };
  }

  // Draw Flying Packets
  function drawPackets() {
    ctx.save();
    packets.forEach(pkt => {
      const link = topologyLinks[pkt.linkIndex];
      if (!link) return;

      const fromNode = getNode(link.from);
      const toNode = getNode(link.to);
      if (!fromNode || !toNode) return;

      let t = pkt.reverse ? (1 - pkt.progress) : pkt.progress;
      let px, py;

      if (link.isVpn) {
        const pt = getQuadraticBezierPoint(fromNode.x, fromNode.y, toNode.x, toNode.y, -30, t);
        px = pt.x;
        py = pt.y;
      } else {
        px = fromNode.x + (toNode.x - fromNode.x) * t;
        py = fromNode.y + (toNode.y - fromNode.y) * t;
      }

      // Draw packet outer glow
      const gradient = ctx.createRadialGradient(px, py, 1, px, py, pkt.size * 2.8);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.4, pkt.color);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(px, py, pkt.size * 2.8, 0, Math.PI * 2);
      ctx.fill();

      // Inner intense core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px, py, pkt.size * 0.7, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  // Draw Device Nodes
  function drawNodes(isDark) {
    const time = Date.now() * 0.002;

    nodesLayout.forEach(node => {
      const meta = NETWORK_NODES[node.id];
      const isActive = (node.id === activeNodeId);
      const isHovered = (node.id === hoveredNodeId);

      ctx.save();

      // 1. Outer Pulse Aura for Active/Hovered Node
      if (isActive || isHovered) {
        const auraRadius = node.radius + 12 + Math.sin(time * 3) * 3;
        ctx.strokeStyle = meta.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.45;
        ctx.beginPath();
        ctx.arc(node.x, node.y, auraRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = meta.color;
        ctx.globalAlpha = 0.12;
        ctx.beginPath();
        ctx.arc(node.x, node.y, auraRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Node Base Circle
      ctx.globalAlpha = 1;
      const baseGrad = ctx.createRadialGradient(
        node.x - node.radius * 0.3,
        node.y - node.radius * 0.3,
        node.radius * 0.2,
        node.x,
        node.y,
        node.radius
      );

      if (isDark) {
        baseGrad.addColorStop(0, '#1a263d');
        baseGrad.addColorStop(1, '#090e19');
      } else {
        baseGrad.addColorStop(0, '#ffffff');
        baseGrad.addColorStop(1, '#e2e8f0');
      }

      ctx.fillStyle = baseGrad;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fill();

      // 3. Node Border Ring
      ctx.strokeStyle = isActive ? meta.color : (isHovered ? '#ffffff' : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'));
      ctx.lineWidth = isActive ? 3.5 : 2;
      ctx.stroke();

      // 4. Center Icon
      ctx.font = `${Math.floor(node.radius * 0.75)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(meta.icon, node.x, node.y);

      // 5. Node Title & Subtitle Labels below
      ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      const labelY = node.y + node.radius + 8;
      ctx.fillText(meta.name.split(' (')[0], node.x, labelY);

      // Sub-label / Role tag
      ctx.font = '600 9px "JetBrains Mono", monospace';
      ctx.fillStyle = meta.color;
      ctx.fillText(meta.role, node.x, labelY + 16);

      // Status indicator mini green light
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(node.x + node.radius - 6, node.y - node.radius + 6, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isDark ? '#080c14' : '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();
    });
  }

  // Tooltip when hovering over a node
  function drawTooltip(nodeId, isDark) {
    const node = getNode(nodeId);
    const meta = NETWORK_NODES[nodeId];
    if (!node || !meta) return;

    ctx.save();
    const tooltipX = node.x;
    const tooltipY = Math.max(25, node.y - node.radius - 28);

    const titleText = `${meta.icon} ${meta.name}`;
    const subText = `${meta.platform} • Latency: ${meta.latency}`;

    ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
    const w1 = ctx.measureText(titleText).width;
    ctx.font = '500 10px "JetBrains Mono", monospace';
    const w2 = ctx.measureText(subText).width;

    const boxWidth = Math.max(w1, w2) + 24;
    const boxHeight = 44;
    const boxX = Math.min(width - boxWidth - 10, Math.max(10, tooltipX - boxWidth / 2));
    const boxY = tooltipY - boxHeight;

    // Tooltip Card
    ctx.fillStyle = isDark ? 'rgba(12, 17, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = meta.color;
    ctx.lineWidth = 1;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 8);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
    ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(titleText, boxX + 10, boxY + 8);

    ctx.fillStyle = isDark ? '#94a3b8' : '#475569';
    ctx.font = '500 10px "JetBrains Mono", monospace';
    ctx.fillText(subText, boxX + 10, boxY + 24);

    ctx.restore();
  }

  // Animation Loop: Move packets and render
  function animate() {
    // Update packet progress
    packets.forEach(pkt => {
      pkt.progress += pkt.speed * animationSpeedMultiplier;
      if (pkt.progress >= 1) {
        pkt.progress = 0;
        if (pkt.isBurst) {
          // Remove burst packet after one cycle
          const idx = packets.indexOf(pkt);
          if (idx > -1) packets.splice(idx, 1);
        }
      }
    });

    draw();
    requestAnimationFrame(animate);
  }

  // Find node by mouse coordinate
  function getNodeAtCoords(x, y) {
    for (let i = 0; i < nodesLayout.length; i++) {
      const node = nodesLayout[i];
      const dx = x - node.x;
      const dy = y - node.y;
      if (Math.sqrt(dx * dx + dy * dy) <= node.radius + 6) {
        return node;
      }
    }
    return null;
  }

  // Update DOM Device Management HUD
  window.updateDeviceHUD = function (nodeId) {
    const meta = NETWORK_NODES[nodeId];
    if (!meta) return;

    activeNodeId = nodeId;

    const hudIcon = document.getElementById('hudIcon');
    const hudCategory = document.getElementById('hudCategory');
    const hudDeviceName = document.getElementById('hudDeviceName');
    const hudState = document.getElementById('hudState');
    const hudDescription = document.getElementById('hudDescription');
    const hudPlatform = document.getElementById('hudPlatform');
    const hudInterfaces = document.getElementById('hudInterfaces');
    const hudThroughput = document.getElementById('hudThroughput');
    const hudSecurity = document.getElementById('hudSecurity');
    const hudTags = document.getElementById('hudTags');
    const hudCpuVal = document.getElementById('hudCpuVal');
    const hudCpuFill = document.getElementById('hudCpuFill');
    const hudMemVal = document.getElementById('hudMemVal');
    const hudMemFill = document.getElementById('hudMemFill');
    const hudNodeLatency = document.getElementById('hudNodeLatency');

    if (hudIcon) hudIcon.textContent = meta.icon;
    if (hudCategory) hudCategory.textContent = meta.role;
    if (hudDeviceName) hudDeviceName.textContent = meta.name;
    if (hudState) hudState.textContent = meta.state;
    if (hudDescription) hudDescription.textContent = meta.desc;
    if (hudPlatform) hudPlatform.textContent = meta.platform;
    if (hudInterfaces) hudInterfaces.textContent = meta.interfaces;
    if (hudThroughput) hudThroughput.textContent = meta.throughput;
    if (hudSecurity) hudSecurity.textContent = meta.security;

    if (hudCpuVal) hudCpuVal.textContent = meta.cpu + '%';
    if (hudCpuFill) hudCpuFill.style.width = meta.cpu + '%';
    if (hudMemVal) hudMemVal.textContent = meta.mem + '%';
    if (hudMemFill) hudMemFill.style.width = meta.mem + '%';
    if (hudNodeLatency) hudNodeLatency.textContent = meta.latency;

    // Render tags
    if (hudTags) {
      hudTags.innerHTML = meta.tags
        .map(t => `<span class="tag">${t}</span>`)
        .join('');
    }

    // Sync node pill buttons
    document.querySelectorAll('.node-pill').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.node === nodeId);
    });

    // Flash HUD subtle glow
    const hudElem = document.getElementById('deviceInspector');
    if (hudElem) {
      hudElem.style.borderColor = meta.color;
      setTimeout(() => {
        hudElem.style.borderColor = '';
      }, 700);
    }
  };

  // Expose function to trigger packet burst
  window.triggerPacketBurst = function () {
    const burstColors = ['#38bdf8', '#f43f5e', '#10b981', '#8b5cf6', '#3b82f6'];

    for (let i = 0; i < 40; i++) {
      const linkIdx = Math.floor(Math.random() * topologyLinks.length);
      const link = topologyLinks[linkIdx];
      packets.push({
        linkIndex: linkIdx,
        progress: Math.random() * 0.4,
        speed: 0.008 + Math.random() * 0.008,
        reverse: Math.random() > 0.5,
        color: burstColors[Math.floor(Math.random() * burstColors.length)],
        size: 4.8,
        isBurst: true
      });
    }

    // Randomize telemetry slightly
    const metricPackets = document.getElementById('metricPackets');
    if (metricPackets) {
      metricPackets.textContent = '14,820 pkt/s';
      setTimeout(() => {
        metricPackets.textContent = '2,840 pkt/s';
      }, 3500);
    }
  };

  // Mouse & Touch Interaction Events
  function getCanvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  canvas.addEventListener('mousemove', function (e) {
    const pos = getCanvasPos(e);
    const node = getNodeAtCoords(pos.x, pos.y);
    hoveredNodeId = node ? node.id : null;
    canvas.style.cursor = node ? 'pointer' : 'default';
  });

  canvas.addEventListener('mouseleave', function () {
    hoveredNodeId = null;
  });

  canvas.addEventListener('click', function (e) {
    const pos = getCanvasPos(e);
    const node = getNodeAtCoords(pos.x, pos.y);
    if (node) {
      window.updateDeviceHUD(node.id);
    }
  });

  canvas.addEventListener('touchstart', function (e) {
    const pos = getCanvasPos(e);
    const node = getNodeAtCoords(pos.x, pos.y);
    if (node) {
      window.updateDeviceHUD(node.id);
    }
  }, { passive: true });

  // Speed Selector Buttons
  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      animationSpeedMultiplier = parseFloat(this.dataset.speed) || 1;
    });
  });

  // Packet burst button
  const btnBurst = document.getElementById('btnSimulateBurst');
  if (btnBurst) {
    btnBurst.addEventListener('click', function () {
      window.triggerPacketBurst();
    });
  }

  // Reset topology button
  const btnReset = document.getElementById('btnResetTopology');
  if (btnReset) {
    btnReset.addEventListener('click', function () {
      window.updateDeviceHUD('internet');
      seedPackets();
    });
  }

  // Quick Select Device Pills in HUD
  document.querySelectorAll('.node-pill').forEach(pill => {
    pill.addEventListener('click', function () {
      const targetNode = this.dataset.node;
      if (targetNode) {
        window.updateDeviceHUD(targetNode);
      }
    });
  });

  // Resize Listener
  window.addEventListener('resize', computeLayout);

  // Initialize
  computeLayout();
  window.updateDeviceHUD('internet');
  animate();

})();
