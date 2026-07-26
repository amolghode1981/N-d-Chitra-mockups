
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import {
    BrowserRouter,
    Routes,
    Route,
    Link,
    useNavigate,
    useParams,
    useLocation,
} from "react-router-dom";

import {
    TransformWrapper,
    TransformComponent,
} from "react-zoom-pan-pinch";

import "./styles.css";

const API = "/api";

const museumNames = {
    met: "The Metropolitan Museum of Art",
    cma: "Cleveland Museum of Art",
};

function Shell({ children }) {
    return (
        <div className="app">
            <header>
                <Link className="brand" to="/">
                    Nād-Chitra
                </Link>

                <span className="tagline">
                    Musical instruments in Indian miniature painting
                </span>
            </header>

            <main>{children}</main>
        </div>
    );
}

function Home() {
    return (
        <div className="home">
            <div className="hero">
                <div className="eyebrow">
                    A visual research prototype
                </div>

                <h1>Nād-Chitra</h1>

                <p>
                    Explore musical instruments depicted in Indian
                    miniature paintings across museum collections.
                </p>
            </div>

            <div className="choices">
                <Link
                    to="/museums"
                    className="choice"
                >
                    <span>Collection</span>

                    <h2>Browse by Museum</h2>

                    <p>
                        Explore paintings within each museum collection.
                    </p>

                    <b>View museums →</b>
                </Link>

                <Link
                    to="/instruments"
                    className="choice"
                >
                    <span>Instrument</span>

                    <h2>Browse by Instrument</h2>

                    <p>
                        Find depictions of an instrument across
                        collections.
                    </p>

                    <b>View instruments →</b>
                </Link>
            </div>
        </div>
    );
}

function Page({ title, intro, children }) {
    return (
        <>
            <Link className="back" to="/">
                ← Nād-Chitra
            </Link>

            <div className="pageTitle">
                <h1>{title}</h1>

                <p>{intro}</p>
            </div>

            {children}
        </>
    );
}

function Museums() {
    const [museums, setMuseums] = useState([]);

    useEffect(() => {
        fetch(`${API}/museums`)
            .then((r) => r.json())
            .then(setMuseums);
    }, []);

    return (
        <Page
            title="Museums"
            intro="Choose a collection to browse its miniature paintings."
        >
            <div className="museumGrid">
                {museums.map((m) => (
                    <Link
                        key={m.id}
                        className="museumCard"
                        to={`/museums/${m.id}`}
                    >
                        <div className="museumMark">
                            {m.id === "met" ? "MET" : "CMA"}
                        </div>

                        <div>
                            <div className="small">
                                {m.location}
                            </div>

                            <h2>{m.name}</h2>

                            <p>
                                {m.count} paintings in this prototype
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </Page>
    );
}

function Instruments() {
    const [items, setItems] = useState([]);

    useEffect(() => {
        fetch(`${API}/instruments`)
            .then((r) => r.json())
            .then(setItems);
    }, []);

    return (
        <Page
            title="Instruments"
            intro="Select an instrument to see every identified depiction across both collections."
        >
            <div className="instrumentGrid">
                {items.map((item) => (
                    <Link
                        key={item.name}
                        className="instrumentCard"
                        to={`/instruments/${encodeURIComponent(item.name)}`}
                    >
                        <h3>{item.name}</h3>

                        <span>
                            {item.count}{" "}
                            {item.count === 1
                                ? "painting"
                                : "paintings"}{" "}
                            →
                        </span>
                    </Link>
                ))}
            </div>
        </Page>
    );
}

function Gallery({ mode }) {
    const params = useParams();

    const value =
        mode === "museum"
            ? params.museum
            : params.instrument;

    const [paintings, setPaintings] = useState([]);

    const query =
        mode === "museum"
            ? `museum=${encodeURIComponent(value)}`
            : `instrument=${encodeURIComponent(value)}`;

    useEffect(() => {
        fetch(`${API}/paintings?${query}`)
            .then((r) => r.json())
            .then(setPaintings);
    }, [query]);

    const title =
        mode === "museum"
            ? museumNames[value]
            : value;

    return (
        <>
            <Link
                className="back"
                to={
                    mode === "museum"
                        ? "/museums"
                        : "/instruments"
                }
            >
                ← Back
            </Link>

            <div className="pageTitle">
                <div className="small">
                    {mode === "museum"
                        ? "Museum Collection"
                        : "Instrument"}
                </div>

                <h1>{title}</h1>

                <p>{paintings.length} paintings</p>
            </div>

            <div className="gallery">
                {paintings.map((p) => (
                    <PaintingCard
                        key={`${p.museum}-${p.id}`}
                        p={p}
                    />
                ))}
            </div>
        </>
    );
}
function PaintingCard({ p }) {
    return (
        <Link
            className="painting"
            to={`/painting/${p.museum}/${p.id}`}
        >
            <div className="imageWrap">
                <img
                    src={p.imageUrl}
                    alt={p.title}
                    loading="lazy"
                />
            </div>

            <div className="paintingText">
                <div className="small">
                    {museumNames[p.museum]}
                </div>

                <h3>{p.title}</h3>

                <p>
                    {[p.approxDate, p.dynasty]
                        .filter(Boolean)
                        .join(" · ")}
                </p>

                <div className="chips">
                    {p.instruments
                        .slice(0, 4)
                        .map((instrument) => (
                            <span key={instrument}>
                                {instrument}
                            </span>
                        ))}
                </div>
            </div>
        </Link>
    );
}
async function fetchMuseumMetadata(
    museum,
    objectId
) {
    const url =
        museum === "met"
            ? `https://collectionapi.metmuseum.org/public/collection/v1/objects/${objectId}`
            : `https://openaccess-api.clevelandart.org/api/artworks/${objectId}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            "Unable to load museum metadata."
        );
    }

    return response.json();
}

function getBestImage(
    museum,
    metadata,
    fallback
) {
    if (!metadata) return fallback;

    if (museum === "met") {
        return (
            metadata.primaryImage ||
            metadata.primaryImageSmall ||
            fallback
        );
    }

    return (
        metadata?.data?.images?.web?.url ||
        metadata?.data?.images?.print?.url ||
        metadata?.data?.images?.full?.url ||
        fallback
    );
}

function normalizeMetadata(
    museum,
    metadata
) {
    if (!metadata) {
        return {
            department: "",
            title: "",
            culture: "",
            date: "",
        };
    }

    if (museum === "met") {
        return {
            department:
                metadata.department || "",

            title:
                metadata.title || "",

            culture:
                metadata.culture || "",

            date:
                metadata.objectDate || "",
        };
    }

    return {
        department:
            metadata.data?.department || "",

        title:
            metadata.data?.title || "",

        culture: Array.isArray(
            metadata.data?.culture
        )
            ? metadata.data.culture[0]
            : metadata.data?.culture || "",

        date:
            metadata.data?.creation_date || "",
    };
}

function LoadingMessage() {
    return (
        <p>
            Loading painting information...
        </p>
    );
}

function ErrorMessage() {
    return (
        <p>
            Unable to load painting information.
        </p>
    );
}
function Painting() {
    const { museum, id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const debug =
        new URLSearchParams(location.search).get("debug") === "1";

    const [painting, setPainting] = useState(null);
    const [metadata, setMetadata] = useState(null);

    const [loadingPainting, setLoadingPainting] = useState(true);
    const [loadingMetadata, setLoadingMetadata] = useState(false);

    const [error, setError] = useState(false);

    useEffect(() => {
        setLoadingPainting(true);

        fetch(`${API}/paintings/${museum}/${id}`)
            .then((r) => r.json())
            .then((data) => {
                setPainting(data);
                setLoadingPainting(false);
            });
    }, [museum, id]);

    async function loadMetadata() {
        if (!painting) return;

        setLoadingMetadata(true);
        setError(false);

        try {
            const json = await fetchMuseumMetadata(
                museum,
                painting.id
            );

            setMetadata(json);
        } catch (e) {
            setError(true);
        } finally {
            setLoadingMetadata(false);
        }
    }

    useEffect(() => {
        if (painting) {
            loadMetadata();
        }
    }, [painting]);

    if (loadingPainting) {
        return <LoadingMessage />;
    }

    if (!painting) {
        return <ErrorMessage />;
    }

    const info = normalizeMetadata(
        museum,
        metadata
    );

    const image =
        getBestImage(
            museum,
            metadata,
            painting.imageUrl
        );
    const pageStyle = {
        height: debug ? "auto" : "calc(100vh - 80px)",
        overflow: debug ? "auto" : "hidden",
    };

    return (
        <div
            style={{
                height: debug ? "auto" : "calc(100vh - 80px)",
                overflowY: debug ? "auto" : "hidden",
                overflowX: "hidden",
            }}
        >
            <Link
                className="back"
                onClick={(e) => {
                    e.preventDefault();
                    navigate(-1);
                }}
            >
                ← Back
            </Link>

            <h1
                style={{
                    margin: "0.5rem 0 1rem 0",
                    fontSize: "2rem",
                    lineHeight: 1.2,
                }}
            >
                {info.title || painting.title}
            </h1>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "auto 280px",
                    justifyContent: "center",
                    alignItems: "start",
                    gap: "2rem",
                }}
            >
                <TransformWrapper
                    initialScale={1}
                    minScale={1}
                    maxScale={6}
                    wheel={{ step: 0.15 }}
                    doubleClick={{ mode: "zoomIn" }}
                    panning={{
                        velocityDisabled: true,
                    }}
                >
                    {({ zoomIn, zoomOut, resetTransform }) => (
                        <div
                            className="imageViewer"
                            style={{
                                position: "relative",
                                border: "1px solid #ddd",
                                background: "#fafafa",
                                padding: "12px",
                                overflow: "hidden",
                            }}
                        >
                            <TransformComponent
                                wrapperStyle={{
                                    width: "100%",
                                    overflow: "hidden",
                                }}
                                contentStyle={{
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                }}
                            >
                                <img
                                    src={image}
                                    alt={painting.title}
                                    style={{
                                        maxWidth: "900px",
                                        maxHeight: "70vh",
                                        width: "auto",
                                        height: "auto",
                                        display: "block",
                                    }}
                                />
                            </TransformComponent>

                            <div
                                className="zoomToolbar"
                                style={{
                                    position: "absolute",
                                    top: 12,
                                    right: 12,
                                    display: "flex",
                                    gap: "6px",
                                }}
                            >
                                <button
                                    className="zoomButton"
                                    title="Zoom out"
                                    onClick={() => zoomOut()}
                                >
                                    −
                                </button>

                                <button
                                    className="zoomButton"
                                    title="Reset view"
                                    onClick={() => resetTransform()}
                                >
                                    ↺
                                </button>

                                <button
                                    className="zoomButton"
                                    title="Zoom in"
                                    onClick={() => zoomIn()}
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    )}
                </TransformWrapper>
                <div
                    style={{
                        width: "380px",
                        marginTop: "16px",
                        maxHeight: "70vh",
                        overflowY: "auto",
                        paddingRight: "8px",
                    }}
                >
                    <div
                        style={{
                            color: "#666",
                            fontSize: "0.95rem",
                            marginBottom: "1rem",
                        }}
                    >
                        {museumNames[painting.museum]}
                    </div>

                    {loadingMetadata ? (
                        <p>Loading museum metadata...</p>
                    ) : (
                        <>
                            <p>
                                <strong>Date:</strong>{" "}
                                {painting.approxDate || info.date || "—"}
                            </p>

                            <p>
                                <strong>Dynasty:</strong>{" "}
                                {painting.dynasty || "—"}
                            </p>
                        </>
                    )}

                    <p>
                        <strong>Object ID:</strong> {painting.id}
                    </p>

                    <h3
                        style={{
                            marginTop: "1.5rem",
                            marginBottom: ".5rem",
                        }}
                    >
                        Instruments
                    </h3>

                    <ul
                        style={{
                            paddingLeft: "1.2rem",
                            marginTop: 0,
                        }}
                    >
                        {painting.instruments.map((i) => (
                            <li key={i}>{i}</li>
                        ))}
                    </ul>

                    {painting.comments && (
                        <div
                            style={{
                                marginTop: "1.5rem",
                                width: "100%",
                                padding: "16px",
                                background: "#f7f4ef",
                                border: "1px solid #d9d4ca",
                                borderRadius: "8px",
                                boxSizing: "border-box",
                            }}
                        >
                            <h3
                                style={{
                                    margin: "0 0 0.75rem 0",
                                    fontSize: "1rem",
                                    fontWeight: 600,
                                }}
                            >
                                Musician's Reading
                            </h3>

                            <p
                                style={{
                                    margin: 0,
                                    lineHeight: 1.7,
                                    fontSize: "1rem",
                                    textAlign: "left",
                                }}
                            >
                                {painting.comments}
                            </p>
                        </div>
                    )}

                    <p style={{ marginTop: "1.5rem" }}>
                        <a
                            className="external"
                            href={painting.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                        >
                            Open Museum Page ↗
                        </a>
                    </p>
                </div>
            </div>

            {debug && (
                <>
                    <hr />

                    <h3>Developer Tools</h3>

                    {error && <p>Unable to load museum metadata.</p>}

                    {metadata && (
                        <pre>{JSON.stringify(metadata, null, 2)}</pre>
                    )}
                </>
            )}
        </div>
    );
}

function App() {
    return (
        <Shell>
            <Routes>
                <Route
                    path="/"
                    element={<Home />}
                />

                <Route
                    path="/museums"
                    element={<Museums />}
                />

                <Route
                    path="/museums/:museum"
                    element={<Gallery mode="museum" />}
                />

                <Route
                    path="/instruments"
                    element={<Instruments />}
                />

                <Route
                    path="/instruments/:instrument"
                    element={<Gallery mode="instrument" />}
                />

                <Route
                    path="/painting/:museum/:id"
                    element={<Painting />}
                />
            </Routes>
        </Shell>
    );
}

ReactDOM.createRoot(
    document.getElementById("root")
).render(
    <BrowserRouter>
        <App />
    </BrowserRouter>
);