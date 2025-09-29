import React, { useState, useEffect } from 'react';
import { Button, Tooltip, Badge } from '@radix-ui/themes';
import { Server, ServerOff, Info } from 'lucide-react';
import {
  StartMCPServer,
  StopMCPServer,
  GetMCPServerStatus,
  GetMCPServerInfo
} from "../wailsjs/go/main/App";

interface MCPServerInfo {
  running: boolean;
  name: string;
  version: string;
  port: string;
  capabilities: string[];
  pid?: number;
}

const MCPStatus: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverInfo, setServerInfo] = useState<MCPServerInfo | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  // Check server status on component mount and periodically
  useEffect(() => {
    checkServerStatus();
    const interval = setInterval(checkServerStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const checkServerStatus = async () => {
    try {
      const [status, info] = await Promise.all([
        GetMCPServerStatus(),
        GetMCPServerInfo()
      ]);
      setIsRunning(status);
      setServerInfo(info as MCPServerInfo);
    } catch (error) {
      console.error('Error checking MCP server status:', error);
    }
  };

  const handleToggleServer = async () => {
    setIsLoading(true);
    try {
      if (isRunning) {
        await StopMCPServer();
      } else {
        await StartMCPServer();
      }
      // Wait a moment for the status to update
      setTimeout(checkServerStatus, 500);
    } catch (error) {
      console.error('Error toggling MCP server:', error);
      alert(`Error ${isRunning ? 'stopping' : 'starting'} MCP server: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (isRunning) {
      return <Badge color="green" size="1">Running</Badge>;
    } else {
      return <Badge color="gray" size="1">Stopped</Badge>;
    }
  };

  const getTooltipContent = () => {
    if (!serverInfo) return "MCP Server";

    return (
      <div style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
        <div><strong>MCP Server</strong></div>
        <div>Status: {isRunning ? 'Running' : 'Stopped'}</div>
        <div>Version: {serverInfo.version}</div>
        <div>Communication: {serverInfo.port}</div>
        {serverInfo.pid && <div>PID: {serverInfo.pid}</div>}
      </div>
    );
  };

  return (
    <div className="mcp-status">
      <div className="mcp-controls">
        <Tooltip content={getTooltipContent()}>
          <Button
            size="2"
            variant="soft"
            onClick={handleToggleServer}
            disabled={isLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {isRunning ? <Server size={16} /> : <ServerOff size={16} />}
            MCP
            {getStatusBadge()}
          </Button>
        </Tooltip>

        {serverInfo && (
          <Tooltip content="Show MCP Server Details">
            <Button
              size="2"
              variant="ghost"
              onClick={() => setShowInfo(!showInfo)}
            >
              <Info size={14} />
            </Button>
          </Tooltip>
        )}
      </div>

      {showInfo && serverInfo && (
        <div className="mcp-info vt32">
          <div>MCP Server Information</div>
          <div>Status: {isRunning ? 'Running' : 'Stopped'}</div>
          <div>Version: {serverInfo.version}</div>
          <div>Capabilities: {serverInfo.capabilities.length}</div>
          {serverInfo.pid && <div>Process ID: {serverInfo.pid}</div>}
        </div>
      )}
    </div>
  );
};

export default MCPStatus;