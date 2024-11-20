import React, { useState, useEffect, useMemo } from 'react';
import DOMPurify from 'dompurify';

const DocumentPageThumbnails = ({ content, onPageSelect }) => {
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(0);

  // Sanitize content to prevent XSS
  const sanitizedContent = useMemo(() => {
    return DOMPurify.sanitize(content || '');
  }, [content]);

  // Function to split content into pages
  const splitContentIntoPages = (htmlContent) => {
    if (!htmlContent) return [];

    // Create a temporary container
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.width = '595px';  // A4 width
    tempDiv.style.position = 'absolute';
    tempDiv.style.top = '-9999px';
    document.body.appendChild(tempDiv);

    const pages = [];
    let currentPageContent = '';
    let currentHeight = 0;
    const MAX_PAGE_HEIGHT = 800; // Approximate page height in pixels

    // Process all child nodes
    Array.from(tempDiv.children).forEach(child => {
      const childHeight = child.scrollHeight;

      // If adding this child would exceed page height, start a new page
      if (currentHeight + childHeight > MAX_PAGE_HEIGHT) {
        pages.push(currentPageContent);
        currentPageContent = '';
        currentHeight = 0;
      }

      // Add child to current page
      currentPageContent += child.outerHTML;
      currentHeight += childHeight;
    });

    // Add last page if not empty
    if (currentPageContent.trim()) {
      pages.push(currentPageContent);
    }

    // Clean up
    document.body.removeChild(tempDiv);

    return pages;
  };

  // Effect to split content when it changes
  useEffect(() => {
    if (sanitizedContent) {
      const splitPages = splitContentIntoPages(sanitizedContent);
      setPages(splitPages);
      setSelectedPage(0);
    }
  }, [sanitizedContent]);

  // Handle page selection
  const handlePageSelect = (index) => {
    setSelectedPage(index);
    if (onPageSelect) {
      onPageSelect(pages[index]);
    }
  };

  return (
    <div className="document-page-thumbnails-container">
      <div className="thumbnails-sidebar">
        {pages.map((page, index) => (
          <div 
            key={index} 
            className={`thumbnail-page ${selectedPage === index ? 'selected' : ''}`}
            onClick={() => handlePageSelect(index)}
          >
            Page {index + 1}
          </div>
        ))}
      </div>
      
      <div className="page-preview">
        {pages.length > 0 && (
          <div 
            className="page-content" 
            dangerouslySetInnerHTML={{ __html: pages[selectedPage] }}
          />
        )}
      </div>

      <style jsx>{`
        .document-page-thumbnails-container {
          display: flex;
          height: 600px;
          border: 1px solid #e0e0e0;
        }

        .thumbnails-sidebar {
          width: 150px;
          border-right: 1px solid #e0e0e0;
          overflow-y: auto;
        }

        .thumbnail-page {
          padding: 10px;
          cursor: pointer;
          border-bottom: 1px solid #f0f0f0;
        }

        .thumbnail-page.selected {
          background-color: #e0e0e0;
        }

        .page-preview {
          flex-grow: 1;
          overflow: auto;
          padding: 20px;
        }

        .page-content {
          max-width: 595px;
          margin: 0 auto;
          background: white;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          min-height: 100%;
        }
      `}</style>
    </div>
  );
};

export default DocumentPageThumbnails;