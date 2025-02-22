const DocumentPreview = ({ post }) => {
    const getFileIcon = (fileName) => {
      const ext = fileName.split('.').pop().toLowerCase();
      switch (ext) {
        case 'pdf': return 'pdf.png';
        case 'doc':
        case 'docx': return 'word.png';
        case 'xls':
        case 'xlsx': return 'excel.png';
        case 'ppt':
        case 'pptx': return 'powerpoint.png';
        default: return 'file.png';
      }
    };
  
    return (
      <div className="bg-gray-100 p-4 rounded-md flex items-center justify-center">
        <img
          src={`/icons/${getFileIcon(post.fileName)}`}
          alt={post.fileName}
          className="w-16 h-16"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/icons/file.png';
          }}
        />
      </div>
    );
  };