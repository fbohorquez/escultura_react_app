import React from "react";
import PropTypes from "prop-types";

import backgroundImage from "../assets/map1.png";

const BackgroundLayout = ({ children, title, subtitle }) => {
  return (
		<div className="container main background">
			<img src={backgroundImage} alt="" className="background" />
			<div className="overlay" />
			<div className={`content ${title ? "content-with-title" : "content-no-title"}`}>
				{(title && (
					<div>
						<div className="content-header">
							<h1 className="title">{title}</h1>
							{subtitle && <p className="subtitle">{subtitle}</p>}
						</div>
						<div className="content-body">{children}</div>
					</div>
				)) ||  children }
			</div>
		</div>
	);
}

BackgroundLayout.propTypes = {
  children: PropTypes.node.isRequired,
};


export default BackgroundLayout;