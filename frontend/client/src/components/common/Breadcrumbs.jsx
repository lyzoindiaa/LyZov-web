import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

/**
 * Semantic, crawlable Breadcrumb navigation component
 * Renders standard HTML <nav>, <ol>, <li>, and <a href="..."> elements with Schema.org markup.
 */
const Breadcrumbs = ({ items = [] }) => {
  if (!items || items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="py-3 px-1 text-sm text-gray-500 dark:text-gray-400 overflow-x-auto whitespace-nowrap scrollbar-none"
    >
      <ol
        className="flex items-center space-x-2"
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        <li
          className="flex items-center"
          itemProp="itemListElement"
          itemScope
          itemType="https://schema.org/ListItem"
        >
          <Link
            to="/"
            className="flex items-center hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            itemProp="item"
          >
            <Home className="w-3.5 h-3.5 mr-1" />
            <span itemProp="name">Home</span>
          </Link>
          <meta itemProp="position" content="1" />
          <ChevronRight className="w-3.5 h-3.5 mx-2 text-gray-400 dark:text-gray-600 flex-shrink-0" />
        </li>

        {items.map((crumb, idx) => {
          const isLast = idx === items.length - 1;
          const position = idx + 2;

          return (
            <li
              key={crumb.url || crumb.name}
              className="flex items-center"
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              {isLast ? (
                <span
                  className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px] sm:max-w-xs md:max-w-md"
                  itemProp="name"
                  aria-current="page"
                >
                  {crumb.name}
                </span>
              ) : (
                <Link
                  to={crumb.url}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate max-w-[150px] sm:max-w-xs"
                  itemProp="item"
                >
                  <span itemProp="name">{crumb.name}</span>
                </Link>
              )}
              <meta itemProp="position" content={String(position)} />
              {!isLast && (
                <ChevronRight className="w-3.5 h-3.5 mx-2 text-gray-400 dark:text-gray-600 flex-shrink-0" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
