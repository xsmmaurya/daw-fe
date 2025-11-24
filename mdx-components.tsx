// mdx-components.tsx
import type { MDXComponents } from "mdx/types";
import React from "react";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Headings
    h1: (props) => <h1 className="title" {...props} />,
    h2: (props) => <h2 className="h2" {...props} />,
    h3: (props) => <h3 className="h3" {...props} />,
    // Text
    p: (props) => <p className="prose" {...props} />,
    a: (props) => <a className="link" {...props} />,
    // Code
    code: (props) => <code className="code" {...props} />,
    pre: (props) => <pre className="code" {...props} />,
    // Lists
    ul: (props) => <ul className="list" {...props} />,
    ol: (props) => <ol className="list" {...props} />,
    li: (props) => <li className="list-item" {...props} />,
    // Tables (optional)
    table: (props) => <table className="table" {...props} />,
    thead: (props) => <thead {...props} />,
    tbody: (props) => <tbody {...props} />,
    tr: (props) => <tr {...props} />,
    th: (props) => <th {...props} />,
    td: (props) => <td {...props} />,
    // Allow overrides from MDX file
    ...components,
  };
}
