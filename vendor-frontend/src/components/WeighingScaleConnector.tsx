import React, { useState, useEffect, useRef } from 'react';
import { Bluetooth, Link, Unlink, AlertCircle } from 'lucide-react';

interface Props {
  onWeightChange: (weight: number) => void;
  className?: string;
}

export const WeighingScaleConnector: React.FC<Props> = ({ onWeightChange, className = '' }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const portRef = useRef<any>(null); // Store reference to the serial port
  const readerRef = useRef<any>(null);

  // Parse weight string (e.g. ST,GS,+0012.450kg or 12.450)
  const parseWeight = (data: string) => {
    // Regex to match the first sequence of numbers (including decimals)
    const match = data.match(/[\d.]+/);
    if (match) {
      const weightStr = match[0];
      const parsedWeight = parseFloat(weightStr);
      if (!isNaN(parsedWeight) && parsedWeight > 0) {
        onWeightChange(parsedWeight);
      }
    }
  };

  const connectSerial = async () => {
    try {
      setError(null);
      if (!('serial' in navigator)) {
        throw new Error('Web Serial API not supported in this browser. Please use Chrome/Edge.');
      }

      // Request a port and open a connection.
      // We assume standard baud rate 9600 for Phoenix scales.
      const port = await (navigator as any).serial.requestPort();

      try {
        await port.open({ baudRate: 9600 });
      } catch (openErr: any) {
        // If the port is already open (e.g. after a hot reload or fast double click), we can still proceed
        if (!openErr.message?.includes('already open')) {
          throw openErr;
        }
      }

      portRef.current = port;
      setIsConnected(true);

      // Check if the stream is already locked
      if (port.readable.locked) {
        throw new Error('Port is locked by another process or previous connection. Please refresh the page.');
      }

      const textDecoder = new TextDecoderStream();
      const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();
      readerRef.current = reader;

      console.log('readableStreamClosed', readableStreamClosed)

      let buffer = '';

      // Listen to data coming from the serial device.
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          // Allow the serial port to be closed later.
          reader.releaseLock();
          break;
        }

        // Append new data to our buffer
        if (value) {
          buffer += value;
          // Most weighing scales send a newline or carriage return character to signify the end of a transmission.
          if (buffer.includes('\n') || buffer.includes('\r')) {
            // Take the most recent complete line
            const lines = buffer.split(/[\r\n]+/);
            // The last item is the incomplete buffer, keep it. 
            // The second to last item is the most recent complete reading.
            if (lines.length > 1) {
              const latestReading = lines[lines.length - 2];
              parseWeight(latestReading);
            }
            buffer = lines[lines.length - 1]; // Keep the incomplete chunk
          }
        }
      }
    } catch (err: any) {
      console.error('Scale Connection Error:', err);
      // Don't show an error if the user just cancelled the pairing dialog
      if (!err.message.includes('No port selected')) {
        setError(err.message || 'Failed to connect to scale.');
      }
      disconnect();
    }
  };

  const disconnect = async () => {
    try {
      if (readerRef.current) {
        await readerRef.current.cancel();
        readerRef.current = null;
      }
      if (portRef.current) {
        await portRef.current.close();
        portRef.current = null;
      }
    } catch (err) {
      console.error("Error closing port", err);
    } finally {
      setIsConnected(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">Scale Connection</label>
        {isConnected ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
            <Link className="w-3 h-3 mr-1" />
            Connected
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
            <Unlink className="w-3 h-3 mr-1" />
            Disconnected
          </span>
        )}
      </div>

      <div className="flex space-x-2">
        <button
          type="button"
          onClick={isConnected ? disconnect : connectSerial}
          className={`flex-1 flex items-center justify-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${isConnected
            ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100'
            : 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
            }`}
        >
          {isConnected ? (
            <>
              <Unlink className="w-4 h-4 mr-2" />
              Disconnect Scale
            </>
          ) : (
            <>
              <Bluetooth className="w-4 h-4 mr-2" />
              Connect Scale (COM Port)
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="flex items-center text-xs text-red-600 mt-1">
          <AlertCircle className="w-3 h-3 mr-1" />
          {error}
        </div>
      )}
    </div>
  );
};
