import TextNode from '@/components/nodes/TextNode';
import LLMNode from '@/components/nodes/LLMNode';
import UploadImageNode from '@/components/nodes/UploadImageNode';
import UploadVideoNode from '@/components/nodes/UploadVideoNode';
import CropImageNode from '@/components/nodes/CropImageNode';
import ExtractFrameNode from '@/components/nodes/ExtractFrameNode';

export const nodeTypes = {
  text: TextNode,
  llm: LLMNode,
  'upload-image': UploadImageNode,
  'upload-video': UploadVideoNode,
  'crop-image': CropImageNode,
  'extract-frame': ExtractFrameNode,
};