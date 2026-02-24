import React, { memo } from 'react';
import { NodeProps } from 'reactflow';

const GroupNode = ({ data }: NodeProps<{ label: string }>) => {
    return (
        <div className="h-full w-full rounded-3xl border-2 border-dashed border-cisco-blue/30 bg-cisco-blue/5 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cisco-blue/60 italic">
                    {data.label || 'Network Group'}
                </span>
            </div>
        </div>
    );
};

export default memo(GroupNode);
