function ToEvent() {
    window.location.href="https://ctf.hscyber.org/register";
}

function ToInPersonEvent() {
    alert("We have noticed an issue when you register via the event link: the progress may be stuck at \"processing\". Confirmation emails should have been sent already, and your ticket should have been registered.");
    window.location.href="https://events.hscyber.org/event/1/outback-overflow-26";
}

function createSponsorDescription(sponsor) {
    var allowedTags = { br: true, em: true, p: true, strong: true, a: true };
    var fragment = document.createDocumentFragment();

    function copyNode(node, parent) {
        if (node.nodeType === Node.TEXT_NODE) {
            parent.appendChild(document.createTextNode(node.nodeValue));
            return;
        }
        if (node.nodeType !== Node.ELEMENT_NODE || !allowedTags[node.nodeName]) {
            Array.prototype.forEach.call(node.childNodes, function (child) {
                copyNode(child, parent);
            });
            return;
        }

        var element = document.createElement(node.nodeName);
        if (node.nodeName === "a") {
            var href = node.getAttribute("href");
            if (!href || !/^https?:\/\//i.test(href)) {
                Array.prototype.forEach.call(node.childNodes, function (child) {
                    copyNode(child, parent);
                });
                return;
            }
            element.href = href;
            element.rel = "noopener";
        }
        Array.prototype.forEach.call(node.childNodes, function (child) {
            copyNode(child, element);
        });
        parent.appendChild(element);
    }

    Array.prototype.forEach.call(sponsor.childNodes, function (child) {
        copyNode(child, fragment);
    });
    return fragment;
}

document.addEventListener("DOMContentLoaded", function () {
    var sponsorContainers = document.querySelectorAll("[data-sponsors]");
    if (!sponsorContainers.length) {
        return;
    }

    fetch("./sponsor.xml")
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Unable to load sponsor.xml (" + response.status + ")");
            }
            return response.text();
        })
        .then(function (xmlText) {
            var documentXml = new DOMParser().parseFromString(xmlText, "application/xml");
            if (documentXml.querySelector("parsererror")) {
                throw new Error("sponsor.xml contains invalid XML");
            }

            var root = documentXml.documentElement;
            if (!root || root.nodeName !== "sponsors") {
                throw new Error("sponsor.xml must have a sponsors root element");
            }

            var tiers = Array.prototype.slice.call(root.children);
            sponsorContainers.forEach(function (container) {
                container.replaceChildren();
                tiers.forEach(function (tier) {
                    var sponsors = Array.prototype.slice.call(tier.children);
                    if (tier.nodeName !== "tier" || !sponsors.length) {
                        return;
                    }

                    var tierSection = document.createElement("section");
                    tierSection.className = "sponsor-tier";
                    var tierName = tier.getAttribute("name") || tier.getAttribute("id");
                    var heading = document.createElement("h3");
                    heading.textContent = tierName;
                    tierSection.appendChild(heading);

                    var list = document.createElement("ul");
                    list.className = "sponsors";
                    sponsors.forEach(function (sponsor) {
                        if (sponsor.nodeName !== "sponsor") {
                            return;
                        }

                        var name = sponsor.getAttribute("name");
                        var url = sponsor.getAttribute("url");
                        if (!name || !url || !/^https?:\/\//i.test(url)) {
                            throw new Error("Each sponsor needs a name and an http(s) URL");
                        }

                        var item = document.createElement("li");
                        var link = document.createElement("a");
                        link.href = url;
                        link.rel = "noopener";
                        var logos = document.createElement("span");
                        logos.className = "sponsor-logos";
                        ["image", "image2"].forEach(function (imageAttribute, imageIndex) {
                            var image = sponsor.getAttribute(imageAttribute);
                            if (!image) {
                                return;
                            }
                            var imageUrl = imageIndex ? (sponsor.getAttribute("url2") || url) : url;
                            if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) {
                                throw new Error("Each sponsor image needs an http(s) URL");
                            }
                            var imageLink = document.createElement("a");
                            imageLink.href = imageUrl;
                            imageLink.rel = "noopener";
                            imageLink.className = "sponsor-logo-link";
                            var logo = document.createElement("img");
                            logo.src = image;
                            logo.alt = sponsor.getAttribute(imageIndex ? "alt2" : "alt") || name;
                            ["width", "height"].forEach(function (attribute) {
                                var value = sponsor.getAttribute(attribute);
                                if (value) {
                                    logo.setAttribute(attribute, value);
                                }
                            });
                            logo.loading = "lazy";
                            if ((sponsor.getAttribute("bg") || "").toLowerCase() === "white") {
                                logo.className = "sponsor-logo--white";
                            }
                            imageLink.appendChild(logo);
                            logos.appendChild(imageLink);
                        });
                        if (logos.children.length) {
                            link.appendChild(logos);
                        }
                        var label = document.createElement("span");
                        label.className = "sponsor-name";
                        label.textContent = name;
                        link.appendChild(label);
                        item.appendChild(link);
                        if ((sponsor.textContent || "").trim()) {
                            var descriptionText = document.createElement("p");
                            descriptionText.appendChild(createSponsorDescription(sponsor));
                            item.appendChild(descriptionText);
                        }
                        list.appendChild(item);
                    });
                    tierSection.appendChild(list);
                    container.appendChild(tierSection);
                });
                if (!container.children.length) {
                    throw new Error("sponsor.xml does not contain any sponsors");
                }
            });
        })
        .catch(function (error) {
            sponsorContainers.forEach(function (container) {
                container.replaceChildren();
                var message = document.createElement("p");
                message.className = "empty";
                message.textContent = "Sponsors could not be loaded. Please try again later.";
                container.appendChild(message);
            });
            console.error(error);
        });
});

document.addEventListener("DOMContentLoaded", function () {
    var prizeContainers = document.querySelectorAll("[data-prizes]");
    var prizeSummary = document.querySelector("[data-prizes-summary]");
    if (!prizeContainers.length && !prizeSummary) {
        return;
    }

    fetch("./prizes.xml")
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Unable to load prizes.xml (" + response.status + ")");
            }
            return response.text();
        })
        .then(function (xmlText) {
            var documentXml = new DOMParser().parseFromString(xmlText, "application/xml");
            if (documentXml.querySelector("parsererror")) {
                throw new Error("prizes.xml contains invalid XML");
            }

            var root = documentXml.documentElement;
            if (!root || root.nodeName !== "prizes") {
                throw new Error("prizes.xml must have a prizes root element");
            }

            var categories = Array.prototype.slice.call(root.children);
            var rankLabels = { "1": "1st", "2": "2nd", "3": "3rd", "4": "4th", "5": "5th" };
            if (prizeSummary) {
                var summaryList = document.createElement("ul");
                summaryList.className = "prize-summary";
                categories.forEach(function (category) {
                    Array.prototype.slice.call(category.children).forEach(function (award) {
                        var rank = award.getAttribute("rank");
                        var label = rankLabels[rank] || rank;
                        var items = Array.prototype.slice.call(award.children).map(function (item) {
                            return (item.textContent || "").trim();
                        });
                        var summaryItem = document.createElement("li");
                        var rankLabel = document.createElement("strong");
                        rankLabel.className = "prize-rank prize-rank--" + rank;
                        rankLabel.textContent = label;
                        summaryItem.appendChild(rankLabel);
                        var itemList = document.createElement("ul");
                        itemList.className = "prize-summary-items";
                        items.forEach(function (item) {
                            var itemElement = document.createElement("li");
                            itemElement.textContent = item;
                            itemList.appendChild(itemElement);
                        });
                        summaryItem.appendChild(itemList);
                        summaryList.appendChild(summaryItem);
                    });
                });
                if (!summaryList.children.length) {
                    throw new Error("prizes.xml does not contain any prize categories");
                }
                prizeSummary.replaceChildren(summaryList);
                var summaryLink = document.createElement("a");
                summaryLink.href = "#prizes-h";
                summaryLink.textContent = "See the prize details";
                summaryLink.className = "prize-summary-link";
                // prizeSummary.appendChild(summaryLink);
            }
            prizeContainers.forEach(function (container) {
                container.replaceChildren();
                var list = document.createElement("ul");
                list.className = "prizes";

                categories.forEach(function (category) {
                    if (category.nodeName !== "category") {
                        return;
                    }

                    var name = category.getAttribute("name");
                    var awards = Array.prototype.slice.call(category.children);
                    if (!name || !awards.length) {
                        throw new Error("Each prize category needs a name and awards");
                    }

                    var item = document.createElement("li");
                    var heading = document.createElement("h3");
                    heading.textContent = name;
                    item.appendChild(heading);
                    var awardList = document.createElement("ul");
                    awards.forEach(function (award) {
                        if (award.nodeName !== "award" || !award.getAttribute("rank")) {
                            throw new Error("Each award needs a rank and description");
                        }
                        var awardItem = document.createElement("li");
                        var rankValue = award.getAttribute("rank");
                        var rank = document.createElement("strong");
                        rank.className = "prize-rank prize-rank--" + rankValue;
                        rank.textContent = rankLabels[rankValue] || rankValue;
                        awardItem.appendChild(rank);
                        var prizeItems = Array.prototype.slice.call(award.children);
                        if (prizeItems.length) {
                            prizeItems.forEach(function (prizeItem) {
                                if (prizeItem.nodeName !== "item" || !(prizeItem.textContent || "").trim()) {
                                    throw new Error("Each prize item needs a description");
                                }
                                var description = document.createElement("ul");
                                var descriptionItem = document.createElement("li");
                                descriptionItem.textContent = (prizeItem.textContent || "").trim();
                                description.appendChild(descriptionItem);
                                awardItem.appendChild(description);
                            });
                        } else if ((award.textContent || "").trim()) {
                            awardItem.appendChild(document.createTextNode(": " + (award.textContent || "").trim()));
                        } else {
                            throw new Error("Each award needs a description");
                        }
                        awardList.appendChild(awardItem);
                    });
                    item.appendChild(awardList);
                    list.appendChild(item);
                });

                if (!list.children.length) {
                    throw new Error("prizes.xml does not contain any prizes");
                }
                container.appendChild(list);
            });
        })
        .catch(function (error) {
            if (prizeSummary) {
                prizeSummary.textContent = "Prize details could not be loaded. Please try again later.";
            }
            prizeContainers.forEach(function (container) {
                container.replaceChildren();
                var message = document.createElement("p");
                message.className = "empty";
                message.textContent = "Prizes could not be loaded. Please try again later.";
                container.appendChild(message);
            });
            console.error(error);
        });
});
