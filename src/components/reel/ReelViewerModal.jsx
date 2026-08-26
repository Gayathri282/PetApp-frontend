import ReelsViewer from './ReelsViewer';

export default function ReelViewerModal({ isOpen, onClose, reel, product, videos, initialVideoId }) {
  return (
    <ReelsViewer
      isOpen={isOpen}
      onClose={onClose}
      reel={reel}
      product={product}
      videos={videos}
      initialVideoId={initialVideoId}
    />
  );
}

export { ReelsViewer };
